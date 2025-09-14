import Event from "Scripts/Events";
import { ASRQueryController } from "./ASRQueryController";

interface SongResponse {
  song: string;
  mp3_url: string;
}

@component
export class FetchSongInfo extends BaseScriptComponent {
  @ui.separator
  @ui.label("ASR Integration for Song Name")
  @input
  private asrQueryController: ASRQueryController;
  

  private mp3Url: string = "https://file-examples.com/storage/fea118fe8a68c5d359b315d/2017/11/file_example_MP3_700KB.mp3";
  
  @ui.separator
  @ui.label("Audio Configuration")
  @input
  private audioChild: SceneObject;
  @input
  private autoPlay: boolean = true;
  
  private internetModule: InternetModule = require("LensStudio:InternetModule");
  private remoteServiceModule: RemoteServiceModule = require("LensStudio:RemoteServiceModule");
  private remoteMediaModule: RemoteMediaModule = require("LensStudio:RemoteMediaModule");
  private currentSongName: string = "";

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
  }

  public fetchSongInfo(songName: string) {
    print(`🎵 [FetchSongInfo] fetchSongInfo() called with song: "${songName}"`);
    
    if (!songName || songName.trim() === '') {
      print("❌ [FetchSongInfo] ERROR: No song name provided");
      this.songInfoReceived.invoke('Error: No song name provided');
      return;
    }
    
    print(`🎵 [FetchSongInfo] Valid song name received: "${songName}"`);
    print(`🎵 [FetchSongInfo] Starting MP3 download test for song: ${songName}`);
    
    // Skip API call and directly download the hardcoded MP3
    print("🎵 [FetchSongInfo] Bypassing API call - using hardcoded MP3 URL");
    print(`🎵 [FetchSongInfo] Target MP3 URL: ${this.mp3Url}`);
    
    this.downloadMP3(this.mp3Url);
    
    // Invoke event with test info
    const testInfo = `Testing MP3 download for: ${songName}`;
    print(`🎵 [FetchSongInfo] Invoking songInfoReceived event: ${testInfo}`);
    this.songInfoReceived.invoke(testInfo);
    
    print("🎵 [FetchSongInfo] fetchSongInfo() completed");
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
    print(`🎵 [FetchSongInfo] Manually downloading MP3 from: ${this.mp3Url}`);
    this.downloadMP3();
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
      print('🎵 [FetchSongInfo] Auto-play enabled - starting playback...');
      try {
        audioComponent.play(1); // Play once
        print('✅ [FetchSongInfo] Audio started playing successfully');
      } catch (error) {
        print(`❌ [FetchSongInfo] ERROR playing audio: ${error}`);
      }
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
    }
    
    print('🎵 [FetchSongInfo] ===== DOWNLOAD PROCESS COMPLETE =====');
  }
}
