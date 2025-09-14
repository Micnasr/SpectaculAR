import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import Tween from "LSTween.lspkg/TweenJS/Tween";
import { LSTween } from "LSTween.lspkg/LSTween";

@component
export class ASRQueryController extends BaseScriptComponent {
  @input
  private button: PinchButton;
  @input
  private activityRenderMesh: RenderMeshVisual;
  @input
  private textDisplay: Text;
  private activityMaterial: Material;

  private asrModule: AsrModule = require("LensStudio:AsrModule");
  private isRecording: boolean = false;
  private isEnabled: boolean = true;
  private lastRecognizedQuery: string = "";

  public onQueryEvent: Event<string> = new Event<string>();

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.init.bind(this));
  }

  private init() {
    this.activityMaterial = this.activityRenderMesh.mainMaterial.clone();
    this.activityRenderMesh.clearMaterials();
    this.activityRenderMesh.mainMaterial = this.activityMaterial;
    this.activityMaterial.mainPass.in_out = 0;
    this.button.onButtonPinched.add(() => {
      if (!this.isEnabled) {
        print("🎤 [ASRQueryController] Controller is disabled - ignoring button press");
        if (this.textDisplay) {
          // Keep showing the last recognized query
          if (this.lastRecognizedQuery) {
            this.textDisplay.text = this.lastRecognizedQuery;
          } else {
            this.textDisplay.text = "Ready to listen";
          }
        }
        return;
      }
      
      this.getVoiceQuery().then((query) => {
        // Store the recognized query
        this.lastRecognizedQuery = query;
        
        // Display the recognized text
        if (this.textDisplay) {
          this.textDisplay.text = query;
        }
        this.onQueryEvent.invoke(query);
      });
    });
  }

  public getVoiceQuery(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isRecording) {
        this.animateVoiceIndicator(false);
        this.asrModule.stopTranscribing();
        this.isRecording = false;
        reject("Already recording, cancel recording");
        return;
      }
      this.isRecording = true;
      
      // Show recording status
      if (this.textDisplay) {
        this.textDisplay.text = "Listening...";
      }
      
      let asrSettings = AsrModule.AsrTranscriptionOptions.create();
      asrSettings.mode = AsrModule.AsrMode.HighAccuracy;
      asrSettings.silenceUntilTerminationMs = 1000;
      asrSettings.onTranscriptionUpdateEvent.add((asrOutput) => {
        if (asrOutput.isFinal) {
          this.isRecording = false;
          this.animateVoiceIndicator(false);
          this.asrModule.stopTranscribing();
          resolve(asrOutput.text);
        }
      });
      asrSettings.onTranscriptionErrorEvent.add((asrOutput) => {
        this.isRecording = false;
        this.animateVoiceIndicator(false);
        
        // Show error message
        if (this.textDisplay) {
          this.textDisplay.text = "Error: " + asrOutput;
        }
        
        reject(asrOutput);
      });
      this.animateVoiceIndicator(true);
      this.asrModule.startTranscribing(asrSettings);
    });
  }

  private animateVoiceIndicator(on: boolean) {
    if (on) {
      LSTween.rawTween(250)
        .onUpdate((data) => {
          let percent = data.t as number;
          this.activityMaterial.mainPass.in_out = percent;
        })
        .start();
    } else {
      LSTween.rawTween(250)
        .onUpdate((data) => {
          let percent = 1 - (data.t as number);
          this.activityMaterial.mainPass.in_out = percent;
        })
        .start();
    }
  }

  // Public methods to enable/disable the ASR controller
  public enableASR() {
    print("🎤 [ASRQueryController] Enabling ASR controller");
    this.isEnabled = true;
    if (this.textDisplay) {
      // Show the last recognized query if available, otherwise show ready message
      if (this.lastRecognizedQuery) {
        this.textDisplay.text = this.lastRecognizedQuery;
      } else {
        this.textDisplay.text = "Ready to listen";
      }
    }
  }

  public disableASR() {
    print("🎤 [ASRQueryController] Disabling ASR controller");
    this.isEnabled = false;
    
    // Stop any ongoing recording
    if (this.isRecording) {
      this.animateVoiceIndicator(false);
      this.asrModule.stopTranscribing();
      this.isRecording = false;
    }
    
    if (this.textDisplay) {
      // Keep the last recognized query displayed, or show a default message if none
      if (this.lastRecognizedQuery) {
        this.textDisplay.text = this.lastRecognizedQuery;
      } else {
        this.textDisplay.text = "Ready to listen";
      }
    }
  }

  public isASREnabled(): boolean {
    return this.isEnabled;
  }

  public getLastRecognizedQuery(): string {
    return this.lastRecognizedQuery;
  }

  public clearLastRecognizedQuery() {
    this.lastRecognizedQuery = "";
    if (this.textDisplay) {
      this.textDisplay.text = "Ready to listen";
    }
  }
}
