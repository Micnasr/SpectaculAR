import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
@component
export class Snap3DInteractable extends BaseScriptComponent {
  @input
  private modelParent: SceneObject;
  @input
  private img: Image;
  @input
  private promptDisplay: Text;
  @input
  private spinner: SceneObject;
  @input
  private mat: Material;
  @input
  private displayPlate: SceneObject;
  @input
  private colliderObj: SceneObject;
  private tempModel: SceneObject = null;
  private finalModel: SceneObject = null;
  private size: number = 20;
  private sizeVec: vec3 = null;
  private isImageLoading: boolean = false;
  private isCancelled: boolean = false;
  private hasValidImage: boolean = false;

  onAwake() {
    // Clone the image material to avoid modifying the original
    let imgMaterial = this.img.mainMaterial;
    imgMaterial.mainPass.baseTex = this.img.mainPass.baseTex;
    this.img.enabled = true; // Enable image preview by default

    let offsetBelow = 0;
    this.sizeVec = vec3.one().uniformScale(this.size);
    this.displayPlate
      .getTransform()
      .setLocalPosition(new vec3(0, -this.size * 0.5 - offsetBelow, 0));
    this.colliderObj.getTransform().setLocalScale(this.sizeVec);
    this.img.getTransform().setLocalScale(this.sizeVec);
  }

  setPrompt(prompt: string) {
    this.promptDisplay.text = '';
  }

  setImage(image: Texture) {
    // Don't switch to image if this object has been cancelled
    if (this.isCancelled) {
      print(`[Snap3DInteractable] Ignoring image update - object was cancelled`);
      return;
    }
    
    this.isImageLoading = true;
    this.img.enabled = true; // Keep image preview enabled
    this.img.mainPass.baseTex = image;
    this.hasValidImage = true;
    this.isImageLoading = false;
    
    print(`[Snap3DInteractable] Image preview updated for: ${this.sceneObject.name}`);
  }

  setModel(model: GltfAsset, isFinal: boolean) {
    // Don't update model if this object has been cancelled
    if (this.isCancelled) {
      print(`[Snap3DInteractable] Ignoring model update - object was cancelled`);
      return;
    }
    
    if (isFinal) {
      // Hide image preview only when we have the final model
      this.img.enabled = false;
      if (!isNull(this.finalModel)) {
        this.finalModel.destroy();
      }
      this.spinner.enabled = false;
      this.finalModel = model.tryInstantiate(this.modelParent, this.mat);
      this.finalModel.getTransform().setLocalScale(this.sizeVec);
      print(`[Snap3DInteractable] Final model set for: ${this.sceneObject.name}`);
    } else {
      // Keep image preview visible for temp model
      this.tempModel = model.tryInstantiate(this.modelParent, this.mat);
      this.tempModel.getTransform().setLocalScale(this.sizeVec);
      print(`[Snap3DInteractable] Temp model set for: ${this.sceneObject.name}`);
    }
  }

  /**
   * Cancel this object - prevents further updates
   */
  public cancel(): void {
    this.isCancelled = true;
    this.isImageLoading = false;
    print(`[Snap3DInteractable] Object cancelled: ${this.sceneObject.name}`);
  }

  /**
   * Check if this object is cancelled
   */
  public isObjectCancelled(): boolean {
    return this.isCancelled;
  }

  /**
   * Check if image is currently loading
   */
  public isImageCurrentlyLoading(): boolean {
    return this.isImageLoading;
  }

  onFailure(error: string) {
    this.isCancelled = true;
    this.isImageLoading = false;
    this.img.enabled = false;
    this.spinner.enabled = false;
    if (this.tempModel) {
      this.tempModel.destroy();
    }
    if (this.finalModel) {
      this.finalModel.destroy();
    }
    this.promptDisplay.text = "Error: " + error;
    setTimeout(() => {
      this.destroy();
    }, 5000); // Hide error after 5 seconds
  }
}
