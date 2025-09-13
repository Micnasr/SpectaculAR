import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import Tween from "LSTween.lspkg/TweenJS/Tween";
import { LSTween } from "LSTween.lspkg/LSTween";

@component
export class NewQueryController extends BaseScriptComponent {
  @input
  private button: PinchButton;

  @input
  private activityRenderMesh: RenderMeshVisual;
    
  @input
  private audioComponent: AudioComponent;

  private activityMaterial: Material;

  @ui.label("Prompts to Send")
  @input
  public queryPrompts: string[] = ["pineapple on a popsicle stick", "a cute robot", "a magical castle"]; // default values

  public onQueryEvent: Event<string[]> = new Event<string[]>();

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.init.bind(this));
  }

  private init() {
    // Clone the material so we can animate it without affecting others
    this.activityMaterial = this.activityRenderMesh.mainMaterial.clone();
    this.activityRenderMesh.clearMaterials();
    this.activityRenderMesh.mainMaterial = this.activityMaterial;
    this.activityMaterial.mainPass.in_out = 0;

    // When the button is pinched, send all prompts at once
    this.button.onButtonPinched.add(() => {
      this.animateVoiceIndicator(true);
            
      this.audioComponent.play(-1);

      // Send all prompts from the list
      this.onQueryEvent.invoke(this.queryPrompts);

      // Turn off indicator after short delay
      this.animateVoiceIndicator(false);
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
}