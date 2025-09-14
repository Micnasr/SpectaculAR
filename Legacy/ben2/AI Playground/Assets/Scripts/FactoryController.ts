import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";

@component
export class FactoryController extends BaseScriptComponent {
  @input
  factory: Snap3DInteractableFactory;
  
  @input
  @widget(new SliderWidget(0, 10, 1))
  childIndex: number = 0;

  onUpdate() {
    // Update factory when index changes
    if (this.factory && this.childIndex !== this.factory.getCurrentChildIndex()) {
      this.factory.enableChild(this.childIndex);
    }
  }

  /**
   * Set which child should be enabled by index
   */
  public setChildIndex(index: number): boolean {
    if (!this.factory) {
      print("FactoryController: No factory assigned!");
      return false;
    }

    this.childIndex = index;
    return this.factory.enableChild(index);
  }
}
