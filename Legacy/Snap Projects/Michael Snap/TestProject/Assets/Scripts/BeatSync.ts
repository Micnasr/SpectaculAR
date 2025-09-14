@component
export class BeatSync extends BaseScriptComponent {
    
    @input
    @hint("Audio Analyzer Script Component")
    audioAnalyzerScript!: ScriptComponent
    
    @input
    @hint("How high to move (0.1 - 5.0)")
    moveHeight: number = 2.0
    
    @input
    @hint("Which frequency band to use (0 = bass, 7 = treble)")
    frequencyBand: number = 0
    
    @input
    @hint("Ignore movements below this energy level (0.1 - 0.8)")
    movementThreshold: number = 0.3
    
    private basePosition!: vec3
    private debugged: boolean = false
    
    onAwake() {
        if (!this.audioAnalyzerScript) {
            print("❌ BeatSync: Audio Analyzer script not assigned!")
            return
        }
        
        // Store this object's original position
        this.basePosition = this.getSceneObject().getTransform().getLocalPosition()
        
        // Start the movement update loop
        const updateEvent = this.createEvent("LateUpdateEvent")
        updateEvent.bind(() => {
            this.updateMovement()
        })
        
        print(`🎵 BeatSync initialized on ${this.getSceneObject().name}!`)
        print(`📍 Base position: ${this.basePosition.y.toFixed(2)}`)
    }
    
    private updateMovement() {
        if (!this.audioAnalyzerScript?.api) {
            return
        }
        
        // Debug the API once
        if (!this.debugged) {
            this.debugAudioAPI()
            this.debugged = true
        }
        
        try {
            let bandEnergy = 0
            
            if (typeof this.audioAnalyzerScript.api.getBandByIndex === 'function') {
                bandEnergy = this.audioAnalyzerScript.api.getBandByIndex(this.frequencyBand)
            } else if (typeof this.audioAnalyzerScript.api.getBands === 'function') {
                const bands = this.audioAnalyzerScript.api.getBands()
                bandEnergy = bands[this.frequencyBand] || 0
            } else if (typeof this.audioAnalyzerScript.api.getAverage === 'function') {
                bandEnergy = this.audioAnalyzerScript.api.getAverage()
            } else {
                return
            }
            
            // Only move if energy is above threshold, otherwise stay at base
            let newY = this.basePosition.y
            if (bandEnergy > this.movementThreshold) {
                newY = this.basePosition.y + (bandEnergy * this.moveHeight)
            }
            
            const newPosition = new vec3(this.basePosition.x, newY, this.basePosition.z)
            this.getSceneObject().getTransform().setLocalPosition(newPosition)
            
        } catch (error) {
            print(`❌ Error in updateMovement: ${error}`)
        }
    }
    
    private debugAudioAPI() {
        print("🔍 Debugging Audio Analyzer API...")
        
        const api = this.audioAnalyzerScript.api
        
        if (!api) {
            print("❌ API is null or undefined")
            return
        }
        
        // Check what methods are available
        const methods = Object.getOwnPropertyNames(api)
        print(`📋 Available API methods: ${methods.join(", ")}`)
        
        // Test specific methods
        const testMethods = ['getBandByIndex', 'getBands', 'getAverage', 'getNumMel']
        for (const method of testMethods) {
            const exists = typeof api[method] === 'function'
            print(`${exists ? '✅' : '❌'} ${method}: ${exists ? 'exists' : 'missing'}`)
        }
    }
}