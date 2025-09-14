import { NewQueryController } from "./NewQueryController";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";

@component
export class InteractableImageGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Example of using generative 3D with Snap3D")
  @input
  snap3DFactory: Snap3DInteractableFactory;

  @ui.separator
  @input
  private queryController: NewQueryController;

  @input
  private targetPosition: SceneObject;

  private generatedObjectsCount: number = 0;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this.queryController.onQueryEvent.add((queries) => {
        // Send all prompts to the factory for batch processing
        this.snap3DFactory.createInteractable3DObjectBatch(
          queries,
          this.targetPosition.getTransform().getWorldPosition()
        );
        
        // Update counter
        this.generatedObjectsCount += queries.length;
      });
    });
  }
}