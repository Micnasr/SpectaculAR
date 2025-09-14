import { Snap3D } from "Remote Service Gateway.lspkg/HostedSnap/Snap3D";
import { Snap3DTypes } from "Remote Service Gateway.lspkg/HostedSnap/Snap3DTypes";
import { Snap3DInteractable } from "./Snap3DInteractable";

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export class Snap3DInteractableFactory extends BaseScriptComponent {
  @ui.separator
  @ui.group_start("Submit and Get Status Example")
  @input
  @widget(new TextAreaWidget())
  private prompt: string = "A cute dog wearing a hat";
  @input
  private refineMesh: boolean = true;
  @input
  private useVertexColor: boolean = false;
  @ui.group_end
  @input
  runOnTap: boolean = false;


  @input
  snap3DInteractablePrefab: ObjectPrefab;

  private wcfmp = WorldCameraFinderProvider.getInstance();
  private currentChildIndex: number = 0;

  // Batching system
  private requestQueue: string[] = [];
  private isProcessingBatch: boolean = false;
  private currentBatch: string[] = [];
  private batchSize: number = 5;
  
  // Timing system
  private timingData: number[] = [];
  private timingTimer: number = 0;
  private isTimingActive: boolean = false;
  private currentTimingIndex: number = 0;

  onAwake() {
    this.createEvent("TapEvent").bind(() => {
      if (this.runOnTap) {
        this.createInteractable3DObject(this.prompt);
      }
    });
    
    // Set up update event for timing system
    this.createEvent("UpdateEvent").bind(() => {
      if (this.isTimingActive && this.timingData.length > 0) {
        this.timingTimer += getDeltaTime();
        
        // Check if it's time to activate the next child
        if (this.currentTimingIndex < this.timingData.length) {
          const targetTime = this.timingData[this.currentTimingIndex];
          if (this.timingTimer >= targetTime) {
            this.enableChild(this.currentTimingIndex);
            this.currentTimingIndex++;
            print(`🎯 [Snap3DFactory] Activated child ${this.currentTimingIndex - 1} at ${targetTime}s`);
          }
        }
      }
    });
  }

  /**
   * Add requests to the batch queue and process them in batches of 5
   */
  public createInteractable3DObjectBatch(
    inputs: string[],
    overridePosition?: vec3
  ): void {
    // Add all inputs to the queue
    this.requestQueue.push(...inputs);
    
    // Start processing if not already processing
    if (!this.isProcessingBatch) {
      this.processNextBatch(overridePosition);
    }
  }

  createInteractable3DObject(
    input: string,
    overridePosition?: vec3
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Spawn a new prefab for this request
      let outputObj = this.snap3DInteractablePrefab.instantiate(
        this.sceneObject
      );
      outputObj.name = "Snap3DInteractable - " + input;
      
      // Disable the newly created child by default
      outputObj.enabled = false;

      let snap3DInteractable = outputObj.getComponent(
        Snap3DInteractable.getTypeName()
      );
      snap3DInteractable.setPrompt(input);

      // Position object
      if (overridePosition) {
        outputObj.getTransform().setWorldPosition(overridePosition);
      } else {
        let newPos = this.wcfmp.getForwardPosition(80);
        outputObj.getTransform().setWorldPosition(newPos);
      }

      // Submit prompt to Snap3D
      Snap3D.submitAndGetStatus({
        prompt: input,
        format: "glb",
        refine: this.refineMesh,
        use_vertex_color: this.useVertexColor,
      })
        .then((submitGetStatusResults) => {
          submitGetStatusResults.event.add(([value, assetOrError]) => {
            // Check if object was cancelled before processing
            if (snap3DInteractable.isObjectCancelled()) {
              print(`[Snap3DFactory] Ignoring update for cancelled object: ${outputObj.name}`);
              return;
            }

            if (value === "image") {
              assetOrError = assetOrError as Snap3DTypes.TextureAssetData;
              snap3DInteractable.setImage(assetOrError.texture);

            } else if (value === "base_mesh") {
              assetOrError = assetOrError as Snap3DTypes.GltfAssetData;
              if (!this.refineMesh) {
                snap3DInteractable.setModel(assetOrError.gltfAsset, true);
                resolve("Successfully created mesh with prompt: " + input);
              } else {
                snap3DInteractable.setModel(assetOrError.gltfAsset, false);
              }

            } else if (value === "refined_mesh") {
              assetOrError = assetOrError as Snap3DTypes.GltfAssetData;
              snap3DInteractable.setModel(assetOrError.gltfAsset, true);
              resolve("Successfully created mesh with prompt: " + input);

            } else if (value === "failed") {
              assetOrError = assetOrError as Snap3DTypes.ErrorData;
              print("Error: " + assetOrError.errorMsg);
              reject("Failed to create mesh with prompt: " + input);
            }
          });
        })
        .catch((error) => {
          // Only call onFailure if object wasn't cancelled
          if (!snap3DInteractable.isObjectCancelled()) {
            snap3DInteractable.onFailure(error);
          }
          print("Error submitting task or getting status: " + error);
          reject("Failed to create mesh with prompt: " + input);
        });
    });
  }

  /**
   * Disable all children by default
   */
  private disableAllChildren() {
    const childrenCount = this.sceneObject.getChildrenCount();
    if (childrenCount === 0) {
      return;
    }

    // Disable all children
    for (let i = 0; i < childrenCount; i++) {
      const child = this.sceneObject.getChild(i);
      child.enabled = false;
    }

    print(`Disabled all ${childrenCount} children by default`);
  }

  /**
   * Manually set which child should be visible
   */
  public setActiveChild(index: number) {
    const childrenCount = this.sceneObject.getChildrenCount();
    if (childrenCount === 0 || index < 0 || index >= childrenCount) {
      return;
    }

    // Disable all children
    for (let i = 0; i < childrenCount; i++) {
      const child = this.sceneObject.getChild(i);
      child.enabled = false;
    }

    // Enable the specified child
    const targetChild = this.sceneObject.getChild(index);
    targetChild.enabled = true;
    this.currentChildIndex = index;

    print(`Set active child to index ${index}: ${targetChild.name}`);
  }

  /**
   * Get the current active child index
   */
  public getCurrentChildIndex(): number {
    return this.currentChildIndex;
  }

  /**
   * Get the total number of children
   */
  public getChildrenCount(): number {
    return this.sceneObject.getChildrenCount();
  }

  /**
   * Enable a specific child by index, disabling all others
   */
  public enableChild(index: number): boolean {
    const childrenCount = this.sceneObject.getChildrenCount();
    if (childrenCount === 0 || index < 0 || index >= childrenCount) {
      print(`Invalid child index: ${index}. Valid range: 0-${childrenCount - 1}`);
      return false;
    }

    // Disable all children first
    for (let i = 0; i < childrenCount; i++) {
      const child = this.sceneObject.getChild(i);
      child.enabled = false;
    }

    // Enable the specified child
    const targetChild = this.sceneObject.getChild(index);
    targetChild.enabled = true;
    this.currentChildIndex = index;

    print(`Enabled child at index ${index}: ${targetChild.name}`);
    return true;
  }

  /**
   * Set timing data for child activation
   */
  public setTimingData(timingData: number[]): void {
    this.timingData = [...timingData]; // Create a copy
    this.timingTimer = 0;
    this.currentTimingIndex = 0;
    this.isTimingActive = false; // Don't start automatically
    
    print(`🎯 [Snap3DFactory] Timing data set: ${this.timingData.join(', ')} seconds`);
    print(`🎯 [Snap3DFactory] Will activate ${this.timingData.length} children at specified times`);
  }
  
  /**
   * Start the timing system
   */
  public startTiming(): void {
    if (this.timingData.length === 0) {
      print("⚠️ [Snap3DFactory] WARNING: No timing data set - cannot start timing system");
      return;
    }
    
    this.timingTimer = 0;
    this.currentTimingIndex = 0;
    this.isTimingActive = true;
    
    // Disable all children initially
    this.disableAllChildren();
    
    print(`🎯 [Snap3DFactory] Timing system started - will activate children at: ${this.timingData.join(', ')} seconds`);
  }
  
  /**
   * Stop the timing system
   */
  public stopTiming(): void {
    this.isTimingActive = false;
    this.timingTimer = 0;
    this.currentTimingIndex = 0;
    
    print("🎯 [Snap3DFactory] Timing system stopped");
  }
  
  /**
   * Get current timing status
   */
  public getTimingStatus(): string {
    if (!this.isTimingActive) {
      return "Timing system is inactive";
    }
    
    return `Timing active - ${this.currentTimingIndex}/${this.timingData.length} children activated, timer: ${this.timingTimer.toFixed(1)}s`;
  }

  /**
   * Cancel a specific child object by index
   */
  public cancelChild(index: number): boolean {
    const childrenCount = this.sceneObject.getChildrenCount();
    if (childrenCount === 0 || index < 0 || index >= childrenCount) {
      print(`Invalid child index for cancellation: ${index}. Valid range: 0-${childrenCount - 1}`);
      return false;
    }

    const targetChild = this.sceneObject.getChild(index);
    const snap3DInteractable = targetChild.getComponent(Snap3DInteractable.getTypeName());
    
    if (snap3DInteractable) {
      snap3DInteractable.cancel();
      print(`Cancelled child at index ${index}: ${targetChild.name}`);
      return true;
    }
    
    return false;
  }

  /**
   * Cancel all children objects
   */
  public cancelAllChildren(): void {
    const childrenCount = this.sceneObject.getChildrenCount();
    for (let i = 0; i < childrenCount; i++) {
      const child = this.sceneObject.getChild(i);
      const snap3DInteractable = child.getComponent(Snap3DInteractable.getTypeName());
      if (snap3DInteractable) {
        snap3DInteractable.cancel();
      }
    }
    print(`Cancelled all ${childrenCount} children`);
  }

  /**
   * Get status of all children (cancelled, loading, etc.)
   */
  public getChildrenStatus(): string[] {
    const childrenCount = this.sceneObject.getChildrenCount();
    const statuses: string[] = [];
    
    for (let i = 0; i < childrenCount; i++) {
      const child = this.sceneObject.getChild(i);
      const snap3DInteractable = child.getComponent(Snap3DInteractable.getTypeName());
      
      if (snap3DInteractable) {
        let status = `Child ${i}: ${child.name}`;
        if (snap3DInteractable.isObjectCancelled()) {
          status += " [CANCELLED]";
        } else if (snap3DInteractable.isImageCurrentlyLoading()) {
          status += " [LOADING IMAGE]";
        } else {
          status += " [ACTIVE]";
        }
        statuses.push(status);
      }
    }
    
    return statuses;
  }

  /**
   * Process the next batch of requests (up to 5)
   */
  private processNextBatch(overridePosition?: vec3): void {
    if (this.isProcessingBatch || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingBatch = true;
    
    // Get up to 5 requests from the queue
    this.currentBatch = this.requestQueue.splice(0, this.batchSize);
    
    print(`Processing batch of ${this.currentBatch.length} requests`);
    
    // Process each request in the current batch
    let completedCount = 0;
    this.currentBatch.forEach((input, index) => {
      this.createInteractable3DObject(input, overridePosition)
        .then(() => {
          completedCount++;
          print(`Completed ${completedCount}/${this.currentBatch.length} in current batch`);
          
          // Check if this batch is complete
          if (completedCount === this.currentBatch.length) {
            this.onBatchCompleted();
          }
        })
        .catch((error) => {
          completedCount++;
          print(`Failed ${completedCount}/${this.currentBatch.length} in current batch: ${error}`);
          
          // Check if this batch is complete (even with failures)
          if (completedCount === this.currentBatch.length) {
            this.onBatchCompleted();
          }
        });
    });
  }

  /**
   * Called when the current batch is completed
   */
  private onBatchCompleted(): void {
    print(`Batch completed. Queue remaining: ${this.requestQueue.length}`);
    this.isProcessingBatch = false;
    this.currentBatch = [];
    
    // Process next batch if there are more requests
    if (this.requestQueue.length > 0) {
      this.processNextBatch();
    }
  }

  /**
   * Clear the request queue and cancel all pending operations
   */
  public clearQueue(): void {
    this.requestQueue = [];
    this.cancelAllChildren();
    print(`[Snap3DFactory] Cleared request queue and cancelled all children`);
  }

  /**
   * Get current queue status
   */
  public getQueueStatus(): string {
    return `Queue: ${this.requestQueue.length} pending, Processing: ${this.isProcessingBatch}, Current batch: ${this.currentBatch.length}`;
  }
}