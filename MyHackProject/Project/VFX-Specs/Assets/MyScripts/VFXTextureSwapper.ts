@component
export class VFXTextureSwapper extends BaseScriptComponent {
    
    @input
    @hint("The VFX Component to modify")
    vfxComponent: VFXComponent;
    
    @input
    @hint("Array of 10 iridescence texture variants")
    textureVariants: Texture[] = [];
    
    @input
    @hint("Time interval in seconds between texture swaps")
    swapInterval: number = 10.0;
    
    @input
    @hint("Parameter name for the 3D texture in the VFX graph")
    textureParameterName: string = "3D Texture";
    
    @input
    @hint("Enable debug logging")
    debugMode: boolean = true;
    
    private currentTextureIndex: number = 0;
    private swapTimer: DelayedCallbackEvent;
    private isSwapping: boolean = false;
    
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    
    onStart() {
        this.debugLog("VFX Texture Swapper started");
        
        // Validate inputs
        if (!this.vfxComponent) {
            this.debugLog("Error: VFX Component not assigned!", true);
            return;
        }
        
        if (!this.vfxComponent.asset) {
            this.debugLog("Error: VFX Asset not found on VFX Component!", true);
            return;
        }
        
        if (this.textureVariants.length === 0) {
            this.debugLog("Error: No texture variants provided!", true);
            return;
        }
        
        if (this.textureVariants.length < 10) {
            this.debugLog("Warning: Less than 10 texture variants provided. Will cycle through available textures.");
        }
        
        // Start the texture swapping cycle
        this.startTextureSwapping();
    }
    
    private startTextureSwapping() {
        if (this.isSwapping) {
            return;
        }
        
        this.isSwapping = true;
        this.debugLog(`Starting texture swapping every ${this.swapInterval} seconds`);
        
        // Apply initial texture
        this.swapToNextTexture();
        
        // Set up recurring timer
        this.scheduleNextSwap();
    }
    
    private scheduleNextSwap() {
        if (this.swapTimer) {
            this.swapTimer.enabled = false;
        }
        
        this.swapTimer = this.createEvent("DelayedCallbackEvent");
        this.swapTimer.bind(() => {
            this.swapToNextTexture();
            this.scheduleNextSwap(); // Schedule the next swap
        });
        
        this.swapTimer.enabled = true;
    }
    
    private swapToNextTexture() {
        if (!this.vfxComponent || !this.vfxComponent.asset) {
            this.debugLog("Error: VFX Component or Asset not available for texture swap", true);
            return;
        }
        
        // Get the current texture
        const currentTexture = this.textureVariants[this.currentTextureIndex];
        
        if (!currentTexture) {
            this.debugLog(`Error: Texture at index ${this.currentTextureIndex} is null or undefined`, true);
            return;
        }
        
        try {
            // Access the VFX asset properties and set the texture parameter
            const vfxProperties = this.vfxComponent.asset.properties;
            
            if (vfxProperties && vfxProperties[this.textureParameterName] !== undefined) {
                vfxProperties[this.textureParameterName] = currentTexture;
                this.debugLog(`Swapped to texture ${this.currentTextureIndex + 1}/${this.textureVariants.length}: ${currentTexture.name || 'unnamed'}`);
            } else {
                this.debugLog(`Error: Texture parameter '${this.textureParameterName}' not found in VFX asset properties`, true);
                this.debugLog("Available parameters: " + Object.keys(vfxProperties || {}).join(", "));
            }
        } catch (error) {
            this.debugLog(`Error setting texture parameter: ${error.message}`, true);
        }
        
        // Move to next texture (cycle back to 0 if at end)
        this.currentTextureIndex = (this.currentTextureIndex + 1) % this.textureVariants.length;
    }
    
    /**
     * Manually trigger a texture swap (useful for testing or manual control)
     */
    public manualSwap() {
        this.debugLog("Manual texture swap triggered");
        this.swapToNextTexture();
    }
    
    /**
     * Stop the automatic texture swapping
     */
    public stopSwapping() {
        if (this.swapTimer) {
            this.swapTimer.enabled = false;
        }
        this.isSwapping = false;
        this.debugLog("Texture swapping stopped");
    }
    
    /**
     * Resume automatic texture swapping
     */
    public resumeSwapping() {
        if (!this.isSwapping) {
            this.startTextureSwapping();
        }
    }
    
    /**
     * Set a specific texture by index
     */
    public setTextureByIndex(index: number) {
        if (index < 0 || index >= this.textureVariants.length) {
            this.debugLog(`Error: Texture index ${index} is out of range (0-${this.textureVariants.length - 1})`, true);
            return;
        }
        
        this.currentTextureIndex = index;
        this.swapToNextTexture();
    }
    
    /**
     * Get the current texture index
     */
    public getCurrentTextureIndex(): number {
        return this.currentTextureIndex;
    }
    
    /**
     * Get the total number of texture variants
     */
    public getTextureCount(): number {
        return this.textureVariants.length;
    }
    
    private debugLog(message: string, isError: boolean = false) {
        if (this.debugMode) {
            const prefix = isError ? "[VFXTextureSwapper ERROR]" : "[VFXTextureSwapper]";
            print(`${prefix} ${message}`);
        }
    }
    
    onDestroy() {
        this.stopSwapping();
    }
}
