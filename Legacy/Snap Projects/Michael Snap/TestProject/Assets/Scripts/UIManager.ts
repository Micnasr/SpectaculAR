import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"

/**
 * Simple music selector with 3 song options and a submit button
 */
@component
export class MusicSelector extends BaseScriptComponent {
  
  @input
  @hint("Button for Song A")
  songAButton!: SceneObject
  
  @input
  @hint("Button for Song B") 
  songBButton!: SceneObject
  
  @input
  @hint("Button for Song C")
  songCButton!: SceneObject
  
  @input
  @hint("Submit button")
  submitButton!: SceneObject
  
  @input
  @hint("Text to show selected song")
  selectedSongText!: Text

  // Private variables
  private songAButton_interactable: Interactable | null = null
  private songBButton_interactable: Interactable | null = null
  private songCButton_interactable: Interactable | null = null
  private submitButton_interactable: Interactable | null = null
  
  private selectedSong: string = "None"

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this.setupButtons()
    })
  }

  private setupButtons(): void {
    const interactableTypeName = Interactable.getTypeName()
    
    // Get interactable components from buttons
    this.songAButton_interactable = this.songAButton.getComponent(interactableTypeName)
    this.songBButton_interactable = this.songBButton.getComponent(interactableTypeName)
    this.songCButton_interactable = this.songCButton.getComponent(interactableTypeName)
    this.submitButton_interactable = this.submitButton.getComponent(interactableTypeName)
    
    // Set up button callbacks
    if (this.songAButton_interactable) {
      this.songAButton_interactable.onTriggerEnd.add(() => this.selectSong("A"))
    }
    
    if (this.songBButton_interactable) {
      this.songBButton_interactable.onTriggerEnd.add(() => this.selectSong("B"))
    }
    
    if (this.songCButton_interactable) {
      this.songCButton_interactable.onTriggerEnd.add(() => this.selectSong("C"))
    }
    
    if (this.submitButton_interactable) {
      this.submitButton_interactable.onTriggerEnd.add(() => this.submitSelection())
    }
    
    // Initialize display
    this.updateDisplay()
    
    print("🎵 Music Selector initialized!")
  }

  private selectSong(songName: string): void {
    this.selectedSong = songName
    this.updateDisplay()
    print(`🎶 Selected: ${songName}`)
  }

  private submitSelection(): void {
    if (this.selectedSong === "None") {
      print("❌ No song selected! Please choose a song first.")
      return
    }
    
    print(`🚀 SUBMITTED: ${this.selectedSong}`)
    print(`🎵 User has chosen to play: ${this.selectedSong}`)
    
    // You can add more logic here later, like:
    // - Start playing the selected song
    // - Change the audio track in your AudioAnalyzer
    // - Switch to different beat patterns
  }

  private updateDisplay(): void {
    if (this.selectedSongText) {
      this.selectedSongText.text = `Selected: ${this.selectedSong}`
    }
  }
}