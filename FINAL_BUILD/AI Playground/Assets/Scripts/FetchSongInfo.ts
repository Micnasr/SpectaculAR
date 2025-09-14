import Event from "Scripts/Events";
import { ASRQueryController } from "./ASRQueryController";
import { NewQueryController } from "./NewQueryController";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";

interface ImageData {
  color: string;
  minute: number;
  objectDescription: string;
  second: number;
}

interface SongResponse {
  images: ImageData[];
  transcript: any[]; // We don't use this, but it's in the response
  song: string;
  mp3_url: string;
}

@component
export class FetchSongInfo extends BaseScriptComponent {
  @ui.separator
  @ui.label("ASR Integration for Song Name")
  @input
  private asrQueryController: ASRQueryController;
  
  @ui.separator
  @ui.label("New Query Controller Integration")
  @input
  private newQueryController: NewQueryController;
  
  @ui.separator
  @ui.label("Snap3D Factory Integration")
  @input
  private snap3DFactory: Snap3DInteractableFactory;
  
  @ui.separator
  @ui.label("API Configuration")
//  @input
  private baseUrl: string = "https://hackthenorth-api-942206148236.us-central1.run.app/song?prompt=";
//  @input
  private mp3Url: string = "https://hackthenorth-api-942206148236.us-central1.run.app/mp3?prompt="//"http://1.1.1"//"http://127.0.0.1:5000/mp3";
  
  @ui.separator
  @ui.label("Audio Configuration")
  @input
  private audioChild: SceneObject;
  @input
  private autoPlay: boolean = true;
  
  @ui.separator
  @ui.label("Audio Analyzer Integration")
  @input
  private audioAnalyzerObject: SceneObject;
  
  @ui.separator
  @ui.label("Countdown Display")
  @input
  private countdownText: Text;
  
  @ui.separator
  @ui.label("Loading Tip Frame")
  @input
  private loadingTipFrame: SceneObject;
  
  private internetModule: InternetModule = require("LensStudio:InternetModule");
  private remoteServiceModule: RemoteServiceModule = require("LensStudio:RemoteServiceModule");
  private remoteMediaModule: RemoteMediaModule = require("LensStudio:RemoteMediaModule");
  private currentSongName: string = "";
  private audioPlayDelayTimer: number = 0;
  private isWaitingToPlay: boolean = false;
  private imageTimingData: number[] = []; // Store timing data in seconds

  songInfoReceived: Event<string>;
  audioDownloaded: Event<AudioTrackAsset>;

  onAwake() {
    print("🎵 [FetchSongInfo] Component Awake - Initializing audio download utility");
    print(`🎵 [FetchSongInfo] MP3 URL configured: ${this.mp3Url}`);
    print(`🎵 [FetchSongInfo] Auto-play enabled: ${this.autoPlay}`);
    print(`🎵 [FetchSongInfo] Audio child assigned: ${this.audioChild ? 'Yes' : 'No'}`);
    
    this.songInfoReceived = new Event<string>();
    this.audioDownloaded = new Event<AudioTrackAsset>();
    
    print("🎵 [FetchSongInfo] Events initialized successfully");
    
    this.createEvent("OnStartEvent").bind(() => {
      print("🎵 [FetchSongInfo] OnStartEvent triggered - Setting up ASR listener");
      
      if (!this.asrQueryController) {
        print("⚠️ [FetchSongInfo] WARNING: No ASR Query Controller assigned!");
        return;
      }
      
      this.asrQueryController.onQueryEvent.add((query) => {
        this.currentSongName = query;
        print(`🎤 [FetchSongInfo] ASR Query received: "${query}"`);
        print(`🎤 [FetchSongInfo] Processing query for song: ${query}`);
        this.fetchSongInfo(query);
      });
      
      print("🎵 [FetchSongInfo] ASR listener setup complete");
    });
    
    // Set up update event for delay timer
    this.createEvent("UpdateEvent").bind(() => {
      if (this.isWaitingToPlay) {
        this.audioPlayDelayTimer += getDeltaTime();
        
        // Calculate remaining time and update countdown display
        const remainingTime = Math.max(0, 45 - this.audioPlayDelayTimer);
        const remainingSeconds = Math.ceil(remainingTime);
        
        if (this.countdownText) {
          if (remainingSeconds > 0) {
            this.countdownText.text = `Your experience will begin in ${remainingSeconds} seconds...`;
          } else {
            this.countdownText.text = "Starting now!";
          }
        }
        
        if (this.audioPlayDelayTimer >= 45) {
          this.isWaitingToPlay = false;
          this.audioPlayDelayTimer = 0;
          
          // Clear countdown text
          if (this.countdownText) {
            this.countdownText.text = "";
          }
          
          this.playAudioAfterDelay();
        }
      }
    });
  }
  public fetchSongInfo(songName: string) {
    print(`🎵 [FetchSongInfo] fetchSongInfo() called with song: "${songName}"`);
    
    if (!songName || songName.trim() === '') {
      print("❌ [FetchSongInfo] ERROR: No song name provided");
      this.songInfoReceived.invoke('Error: No song name provided');
      return;
    }
    
    // Disable ASR controller to prevent multiple requests
    if (this.asrQueryController) {
      this.asrQueryController.disableASR();
    }
    
    // Show fetching status
    if (this.countdownText) {
      this.countdownText.text = "Fetching song...";
    }
    
    const url = this.baseUrl + encodeURIComponent(songName);
    print(`🎵 [FetchSongInfo] Fetching song info for: ${songName}`);
    print(`🎵 [FetchSongInfo] Request URL: ${url}`);
    
    this.internetModule
      .fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        print(`🎵 [FetchSongInfo] Response status: ${response.status}`);
        print(`🎵 [FetchSongInfo] Response ok: ${response.ok}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        print(`✅ [FetchSongInfo] SUCCESS: Server responded with status ${response.status}`);
        print(`✅ [FetchSongInfo] SUCCESS: Response headers: ${JSON.stringify(response.headers)}`);
        return response.text();
      })
      .then((text) => {
        print(`🎵 [FetchSongInfo] Raw response text: ${text}`);
        
        if (!text || text.trim() === '') {
          throw new Error('Empty response from server');
        }
        
        try {
          let data = JSON.parse(text);
          let songResponse = data as SongResponse;
          
          print("✅ [FetchSongInfo] SUCCESS: JSON parsing completed successfully");
          print("🎵 [FetchSongInfo] Parsed song response:");
          print(`🎵 [FetchSongInfo] Song: ${songResponse.song}`);
          print(`🎵 [FetchSongInfo] MP3 URL: ${songResponse.mp3_url}`);
          
          // Print the complete response object
          print("🎵 [FetchSongInfo] Complete response object: " + JSON.stringify(songResponse, null, 2));
          
          print("✅ [FetchSongInfo] SUCCESS: Song data extracted successfully");
          print(`✅ [FetchSongInfo] SUCCESS: Song name: "${songResponse.song}"`);
          print(`✅ [FetchSongInfo] SUCCESS: MP3 URL: "${songResponse.mp3_url}"`);
          
          // Extract object descriptions and timing data from images array
          if (songResponse.images && songResponse.images.length > 0) {
            const objectDescriptions = songResponse.images.map(img => img.objectDescription);
            this.imageTimingData = songResponse.images.map(img => img.minute * 60 + img.second); // Convert to total seconds
            
            // Log detailed timing conversion for debugging
            print(`✅ [FetchSongInfo] SUCCESS: Extracted ${objectDescriptions.length} object descriptions: ${objectDescriptions.join(', ')}`);
            print(`✅ [FetchSongInfo] SUCCESS: Timing conversion details:`);
            songResponse.images.forEach((img, index) => {
              const totalSeconds = img.minute * 60 + img.second;
              print(`  ${index}: ${img.minute}m ${img.second}s = ${totalSeconds}s - "${img.objectDescription}"`);
            });
            print(`✅ [FetchSongInfo] SUCCESS: Final timing data array: [${this.imageTimingData.join(', ')}] seconds`);
            
            // Pass object descriptions to NewQueryController
            if (this.newQueryController) {
              print("🎵 [FetchSongInfo] Updating NewQueryController with object descriptions...");
              this.newQueryController.queryPrompts = objectDescriptions;
              print(`✅ [FetchSongInfo] SUCCESS: NewQueryController updated with prompts: ${objectDescriptions.join(', ')}`);
              
              // Automatically trigger the query processing
              print("🎵 [FetchSongInfo] Automatically triggering NewQueryController processing...");
              this.newQueryController.onQueryEvent.invoke(objectDescriptions);
              print("✅ [FetchSongInfo] SUCCESS: NewQueryController processing triggered automatically");
            } else {
              print("⚠️ [FetchSongInfo] WARNING: No NewQueryController assigned - skipping object description update");
            }
            
            // Pass timing data to Snap3D Factory
            if (this.snap3DFactory) {
              print("🎵 [FetchSongInfo] Updating Snap3D Factory with timing data...");
              this.snap3DFactory.setTimingData(this.imageTimingData);
              print(`✅ [FetchSongInfo] SUCCESS: Snap3D Factory updated with timing data: ${this.imageTimingData.join(', ')} seconds`);
            } else {
              print("⚠️ [FetchSongInfo] WARNING: No Snap3D Factory assigned - skipping timing data update");
            }
          } else {
            print("⚠️ [FetchSongInfo] WARNING: No images array found in response - skipping object description extraction");
          }
          
          // Invoke event with the song info
          this.songInfoReceived.invoke(JSON.stringify(songResponse, null, 2));
          
          // Show downloading status
          if (this.countdownText) {
            this.countdownText.text = "Downloading audio...";
          }
          
          // Download the MP3 file from the fixed endpoint
          print("🎵 [FetchSongInfo] Song info received, now downloading MP3...");
          this.downloadMP3(this.mp3Url + encodeURIComponent(songName));
          
          print("✅ [FetchSongInfo] SUCCESS: Complete song fetch process completed successfully");
          print(`✅ [FetchSongInfo] SUCCESS: Ready to download MP3 for song: "${songResponse.song}"`);
          
        } catch (parseError) {
          print('❌ [FetchSongInfo] Failed to parse song response: ' + parseError);
          print('❌ [FetchSongInfo] Raw response that failed to parse: ' + text);
          
          // Show error in countdown text
          if (this.countdownText) {
            this.countdownText.text = "Error: Invalid response from server";
          }
          
          this.songInfoReceived.invoke('Error: Invalid response from server');
        }
      })
      .catch((error) => {
        print('❌ [FetchSongInfo] Fetch error: ' + error);
        
        // Show error in countdown text
        if (this.countdownText) {
          this.countdownText.text = "Error: Failed to fetch song data";
        }
        
        this.songInfoReceived.invoke('Error: Failed to fetch song data');
      });
  }
  
  // Method to manually fetch song info (for testing or direct calls)
  public fetchSongInfoManually(songName: string) {
    print(`🎵 [FetchSongInfo] fetchSongInfoManually() called with: "${songName}"`);
    this.currentSongName = songName;
    print(`🎵 [FetchSongInfo] Current song name set to: "${this.currentSongName}"`);
    this.fetchSongInfo(songName);
  }
  
  // Method to manually download MP3 (for testing)
  public downloadMP3Manually() {
    print("🎵 [FetchSongInfo] downloadMP3Manually() called");
    if (!this.currentSongName) {
      print("❌ [FetchSongInfo] ERROR: No current song name available for MP3 download");
      return;
    }
    const mp3UrlWithPrompt = this.mp3Url + encodeURIComponent(this.currentSongName);
    print(`🎵 [FetchSongInfo] Manually downloading MP3 from: ${mp3UrlWithPrompt}`);
    this.downloadMP3(mp3UrlWithPrompt);
  }
  
  // Audio control methods
  public playAudio() {
    print("🎵 [FetchSongInfo] playAudio() called");
    
    if (!this.audioChild) {
      print("❌ [FetchSongInfo] ERROR: No audio child assigned");
      return;
    }
    
    print(`🎵 [FetchSongInfo] Audio child found: ${this.audioChild.name}`);
    
    const audioComponent = this.audioChild.getComponent("Component.AudioComponent");
    if (!audioComponent) {
      print("❌ [FetchSongInfo] ERROR: No AudioComponent found on audio child");
      return;
    }
    
    print("🎵 [FetchSongInfo] AudioComponent found");
    
    if (audioComponent.audioTrack) {
      print(`🎵 [FetchSongInfo] Audio track available: ${audioComponent.audioTrack.name}`);
      
      // Enable Audio Analyzer Object before playing
      this.enableAudioAnalyzer();
      
      print("🎵 [FetchSongInfo] Starting audio playback...");
      audioComponent.play(1); // Play once
      print("✅ [FetchSongInfo] Audio playback started successfully");
    } else {
      print("❌ [FetchSongInfo] ERROR: No audio track available to play");
    }
  }
  
  public stopAudio() {
    print("🎵 [FetchSongInfo] stopAudio() called");
    
    if (!this.audioChild) {
      print("❌ [FetchSongInfo] ERROR: No audio child assigned");
      return;
    }
    
    const audioComponent = this.audioChild.getComponent("Component.AudioComponent");
    if (!audioComponent) {
      print("❌ [FetchSongInfo] ERROR: No AudioComponent found on audio child");
      return;
    }
    
    print("🎵 [FetchSongInfo] Stopping audio playback...");
    audioComponent.stop(false); // Stop without fade out
    print("✅ [FetchSongInfo] Audio playback stopped");
    
    // Disable AudioAnalyzer when stopping audio
    this.disableAudioAnalyzer();
    
    // Clear countdown text and disable loading tip frame when stopping
    if (this.countdownText) {
      this.countdownText.text = "";
    }
    this.disableLoadingTipFrame();
    
    // Re-enable ASR controller when song stops
    if (this.asrQueryController) {
      this.asrQueryController.enableASR();
    }
    
    // Stop the Snap3D Factory timing system
    if (this.snap3DFactory) {
      print("🎵 [FetchSongInfo] Stopping Snap3D Factory timing system...");
      this.snap3DFactory.stopTiming();
      print("✅ [FetchSongInfo] Snap3D Factory timing system stopped");
    }
  }
  
  public pauseAudio() {
    print("🎵 [FetchSongInfo] pauseAudio() called");
    
    if (!this.audioChild) {
      print("❌ [FetchSongInfo] ERROR: No audio child assigned");
      return;
    }
    
    const audioComponent = this.audioChild.getComponent("Component.AudioComponent");
    if (!audioComponent) {
      print("❌ [FetchSongInfo] ERROR: No AudioComponent found on audio child");
      return;
    }
    
    print("🎵 [FetchSongInfo] Pausing audio playback...");
    audioComponent.pause(); // Pause (no parameters needed)
    print("✅ [FetchSongInfo] Audio playback paused");
  }
  
  // Getter for the current song name
  public getCurrentSongName(): string {
    print(`🎵 [FetchSongInfo] getCurrentSongName() called - returning: "${this.currentSongName}"`);
    return this.currentSongName;
  }
  
  // Method to manually start countdown
  public startCountdown(duration: number = 45) {
    print(`🎵 [FetchSongInfo] startCountdown() called with duration: ${duration} seconds`);
    
    if (this.isWaitingToPlay) {
      print("⚠️ [FetchSongInfo] WARNING: Countdown already in progress");
      return;
    }
    
    this.isWaitingToPlay = true;
    this.audioPlayDelayTimer = 0;
    
    // Show initial countdown message
    if (this.countdownText) {
      this.countdownText.text = `Starting in ${duration} seconds...`;
    }
    
    print(`✅ [FetchSongInfo] Countdown started for ${duration} seconds`);
  }
  
  // Method to stop countdown
  public stopCountdown() {
    print("🎵 [FetchSongInfo] stopCountdown() called");
    
    this.isWaitingToPlay = false;
    this.audioPlayDelayTimer = 0;
    
    // Clear countdown text and disable loading tip frame
    if (this.countdownText) {
      this.countdownText.text = "";
    }
    this.disableLoadingTipFrame();
    
    // Re-enable ASR controller when countdown is stopped
    if (this.asrQueryController) {
      this.asrQueryController.enableASR();
    }
    
    print("✅ [FetchSongInfo] Countdown stopped");
  }
  
  // Method to manually re-enable ASR controller
  public reEnableASR() {
    print("🎵 [FetchSongInfo] reEnableASR() called");
    
    if (this.asrQueryController) {
      this.asrQueryController.enableASR();
      print("✅ [FetchSongInfo] ASR controller re-enabled");
    } else {
      print("⚠️ [FetchSongInfo] WARNING: No ASR controller assigned");
    }
  }
  
  // Method to play audio after delay
  private playAudioAfterDelay() {
    print('🎵 [FetchSongInfo] 45-second delay completed - starting playback...');
    
    // Disable loading tip frame when countdown ends and audio starts
    this.disableLoadingTipFrame();
    
    if (!this.audioChild) {
      print("❌ [FetchSongInfo] ERROR: No audio child assigned");
      return;
    }
    
    const audioComponent = this.audioChild.getComponent("Component.AudioComponent");
    if (!audioComponent) {
      print("❌ [FetchSongInfo] ERROR: No AudioComponent found on audio child");
      return;
    }
    
    if (audioComponent.audioTrack) {
      // Enable Audio Analyzer Object before playing
      this.enableAudioAnalyzer();
      
      // Start the Snap3D Factory timing system
      if (this.snap3DFactory && this.imageTimingData.length > 0) {
        print("🎵 [FetchSongInfo] Starting Snap3D Factory timing system...");
        this.snap3DFactory.startTiming();
        print("✅ [FetchSongInfo] Snap3D Factory timing system started");
      } else {
        print("⚠️ [FetchSongInfo] WARNING: No Snap3D Factory or timing data - skipping timing system start");
      }
      
      try {
        audioComponent.play(1); // Play once
        print('✅ [FetchSongInfo] Audio started playing successfully after delay');
      } catch (error) {
        print(`❌ [FetchSongInfo] ERROR playing audio: ${error}`);
      }
    } else {
      print("❌ [FetchSongInfo] ERROR: No audio track available to play");
    }
  }
  
  // Enable Audio Analyzer Object
  public enableAudioAnalyzer(): boolean {
    if (!this.audioAnalyzerObject) {
      print('🎵 [FetchSongInfo] No Audio Analyzer Object assigned - cannot enable');
      return false;
    }
    
    print('🎵 [FetchSongInfo] ===== ENABLING AUDIO ANALYZER OBJECT =====');
    this.audioAnalyzerObject.enabled = true;
    print('✅ [FetchSongInfo] Audio Analyzer Object enabled successfully');
    return true;
  }
  
  // Disable Audio Analyzer Object
  public disableAudioAnalyzer(): boolean {
    if (!this.audioAnalyzerObject) {
      print('🎵 [FetchSongInfo] No Audio Analyzer Object assigned - nothing to disable');
      return false;
    }
    
    print('🎵 [FetchSongInfo] ===== DISABLING AUDIO ANALYZER OBJECT =====');
    this.audioAnalyzerObject.enabled = false;
    print('✅ [FetchSongInfo] Audio Analyzer Object disabled successfully');
    return true;
  }
  
  // Enable Loading Tip Frame
  public enableLoadingTipFrame(): boolean {
    if (!this.loadingTipFrame) {
      print('🎵 [FetchSongInfo] No Loading Tip Frame assigned - cannot enable');
      return false;
    }
    
    print('🎵 [FetchSongInfo] ===== ENABLING LOADING TIP FRAME =====');
    this.loadingTipFrame.enabled = true;
    print('✅ [FetchSongInfo] Loading Tip Frame enabled successfully');
    return true;
  }
  
  // Disable Loading Tip Frame
  public disableLoadingTipFrame(): boolean {
    if (!this.loadingTipFrame) {
      print('🎵 [FetchSongInfo] No Loading Tip Frame assigned - nothing to disable');
      return false;
    }
    
    print('🎵 [FetchSongInfo] ===== DISABLING LOADING TIP FRAME =====');
    this.loadingTipFrame.enabled = false;
    print('✅ [FetchSongInfo] Loading Tip Frame disabled successfully');
    return true;
  }
  
  // Set the audio track to the specified audio child component and optionally play it
  private setAudioTrackToChild(audioTrackAsset: AudioTrackAsset) {
    print('🎵 [FetchSongInfo] ===== SETTING AUDIO TRACK TO CHILD =====');
    print(`🎵 [FetchSongInfo] Audio track asset received: ${audioTrackAsset.name}`);
    print(`🎵 [FetchSongInfo] Audio track asset type: ${audioTrackAsset.getTypeName()}`);
    
    if (!this.audioChild) {
      print('❌ [FetchSongInfo] ERROR: No audio child assigned in input');
      return;
    }
    
    print(`🎵 [FetchSongInfo] Audio child found: ${this.audioChild.name}`);
    
    const audioComponent = this.audioChild.getComponent("Component.AudioComponent");
    if (!audioComponent) {
      print('❌ [FetchSongInfo] ERROR: No AudioComponent found on assigned audio child');
      return;
    }
    
    print('🎵 [FetchSongInfo] AudioComponent found - setting audio track...');
    audioComponent.audioTrack = audioTrackAsset;
    print('✅ [FetchSongInfo] Audio track successfully assigned to AudioComponent');
    
    if (this.autoPlay) {
      print('🎵 [FetchSongInfo] Auto-play enabled - waiting 45 seconds before starting playback...');
      
      // Enable loading tip frame during countdown
      this.enableLoadingTipFrame();
      
      // Start the 45-second delay timer
      this.isWaitingToPlay = true;
      this.audioPlayDelayTimer = 0;
      
      // Show initial countdown message
      if (this.countdownText) {
        this.countdownText.text = "Starting in 45 seconds...";
      }
      
      print('🎵 [FetchSongInfo] 45-second delay timer started');
    } else {
      print('🎵 [FetchSongInfo] Audio track set but not playing (autoPlay is disabled)');
    }
    
    print('🎵 [FetchSongInfo] ===== AUDIO TRACK SETUP COMPLETE =====');
  }
  
  // Download MP3 file from the configured MP3 endpoint and save as resource
  private downloadMP3(mp3Url: string = this.mp3Url) {
    print('🎵 [FetchSongInfo] ===== DOWNLOADING MP3 =====');
    print(`🎵 [FetchSongInfo] MP3 URL: ${mp3Url}`);
    print(`🎵 [FetchSongInfo] Download started at: ${new Date().toISOString()}`);
    
    // Validate the URL
    if (!mp3Url || mp3Url.trim() === '' || mp3Url === 'http://1.1.1') {
      print('❌ [FetchSongInfo] ERROR: Invalid MP3 URL provided');
      print(`❌ [FetchSongInfo] URL validation failed: "${mp3Url}"`);
      return;
    }
    
    print('✅ [FetchSongInfo] URL validation passed');
    
    if (!this.remoteServiceModule || !this.remoteMediaModule) {
      print('❌ [FetchSongInfo] ERROR: Remote Service Module or Remote Media Module is missing');
      print(`❌ [FetchSongInfo] RemoteServiceModule: ${this.remoteServiceModule ? 'Available' : 'Missing'}`);
      print(`❌ [FetchSongInfo] RemoteMediaModule: ${this.remoteMediaModule ? 'Available' : 'Missing'}`);
      return;
    }
    
    print('✅ [FetchSongInfo] Required modules available');
    
    try {
      print('🎵 [FetchSongInfo] Creating resource from MP3 URL...');
      
      // Create a resource from the MP3 URL
      const resource: DynamicResource = this.remoteServiceModule.makeResourceFromUrl(mp3Url);
      
      if (resource) {
        print('✅ [FetchSongInfo] Resource created successfully');
        print(`🎵 [FetchSongInfo] Resource type: ${resource.getTypeName()}`);
        print('🎵 [FetchSongInfo] Loading resource as audio track...');
        
        // Load resource and convert it to audio track
        this.remoteMediaModule.loadResourceAsAudioTrackAsset(
          resource,
          (audioTrackAsset) => {
            print('🎵 [FetchSongInfo] ===== MP3 DOWNLOAD SUCCESS =====');
            print(`✅ [FetchSongInfo] MP3 audio track asset loaded successfully: ${audioTrackAsset}`);
            print(`✅ [FetchSongInfo] Audio track asset name: ${audioTrackAsset.name}`);
            print(`✅ [FetchSongInfo] Audio track asset type: ${audioTrackAsset.getTypeName()}`);
            print(`✅ [FetchSongInfo] Download completed at: ${new Date().toISOString()}`);
            
            // Set the audio track to the Audio child component
            print('🎵 [FetchSongInfo] Setting audio track to child component...');
            this.setAudioTrackToChild(audioTrackAsset);
            
            // Invoke event with the downloaded audio track asset
            print('🎵 [FetchSongInfo] Invoking audioDownloaded event...');
            this.audioDownloaded.invoke(audioTrackAsset);
            print('✅ [FetchSongInfo] audioDownloaded event invoked successfully');
          },
          (errorMessage) => {
            print('❌ [FetchSongInfo] ===== MP3 DOWNLOAD FAILED =====');
            print(`❌ [FetchSongInfo] ERROR loading MP3 audio track: ${errorMessage}`);
            print(`❌ [FetchSongInfo] Failed at: ${new Date().toISOString()}`);
            
            // Show error in countdown text
            if (this.countdownText) {
              this.countdownText.text = "Error: Failed to download audio";
            }
          }
        );
      } else {
        print('❌ [FetchSongInfo] ERROR: Failed to create resource from MP3 URL');
        print(`❌ [FetchSongInfo] makeResourceFromUrl returned null for: ${mp3Url}`);
      }
    } catch (error) {
      print('❌ [FetchSongInfo] ===== EXCEPTION DURING DOWNLOAD =====');
      print(`❌ [FetchSongInfo] ERROR downloading MP3: ${error}`);
      print(`❌ [FetchSongInfo] Exception occurred at: ${new Date().toISOString()}`);
      
      // Show error in countdown text
      if (this.countdownText) {
        this.countdownText.text = "Error: Download failed";
      }
    }
    
    print('🎵 [FetchSongInfo] ===== DOWNLOAD PROCESS COMPLETE =====');
  }
}
