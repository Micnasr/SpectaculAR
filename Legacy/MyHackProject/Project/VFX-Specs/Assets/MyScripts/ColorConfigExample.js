// Example configuration for MultiColorCycler (Hex Colors Only)
// This shows how to set up 5 different color parameters with hexadecimal values

//@input Component.VFXComponent vfxComponent {"hint":"VFX Component to modify"}
//@input bool enableDebug {"hint":"Enable debug logging"}
//@input Component.Text displayText {"hint":"Text component to show current color info"}

var ColorConfigExample = function() {
    this.onAwake = function() {
        script.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    };

    this.onStart = function() {
        // Example configuration for 5 color parameters (hex only)
        this.setupColorConfiguration();
    };

    this.setupColorConfiguration = function() {
        // Define 5 different VFX parameters to modify
        var colorParameters = [
            "3D Texture",           // Parameter 1: 3D Texture
            "Color Ramp",           // Parameter 2: Color Ramp  
            "Base Color",           // Parameter 3: Base Color
            "Emission Color",       // Parameter 4: Emission Color
            "Tint Color"            // Parameter 5: Tint Color
        ];

        // Define hex color values for each parameter
        var hexColorValues = [
            "#FF0000",              // Red hex for 3D Texture
            "#00FF00",              // Green hex for Color Ramp
            "#0000FF",              // Blue hex for Base Color
            "#FF00FF",              // Magenta hex for Emission Color
            "#FFFF00"               // Yellow hex for Tint Color
        ];

        // Alternative configuration with more variety (all hex)
        var alternativeConfig = {
            parameters: [
                "3D Texture",
                "Color Ramp", 
                "Base Color",
                "Emission Color",
                "Tint Color"
            ],
            hexValues: [
                "#FF6B6B",          // Coral red
                "#4ECDC4",          // Teal
                "#FFA500",          // Orange
                "#800080",          // Purple
                "#FFC0CB"           // Pink
            ]
        };

        // Rainbow configuration (all hex)
        var rainbowConfig = {
            parameters: [
                "3D Texture",
                "Color Ramp",
                "Base Color", 
                "Emission Color",
                "Tint Color"
            ],
            hexValues: [
                "#FF0000",          // Red
                "#FF8000",          // Orange
                "#FFFF00",          // Yellow
                "#00FF00",          // Green
                "#0000FF"           // Blue
            ]
        };

        // Iridescent configuration (all hex)
        var iridescentConfig = {
            parameters: [
                "3D Texture",
                "Color Ramp",
                "Base Color", 
                "Emission Color",
                "Tint Color"
            ],
            hexValues: [
                "#FF0080",          // Hot pink
                "#8000FF",          // Purple
                "#0080FF",          // Blue
                "#00FF80",          // Cyan
                "#80FF00"           // Lime
            ]
        };

        if (script.enableDebug) {
            print("Hex Color configuration examples:");
            print("Basic config - Parameters: " + JSON.stringify(colorParameters));
            print("Basic config - Hex Values: " + JSON.stringify(hexColorValues));
            print("Alternative config: " + JSON.stringify(alternativeConfig));
            print("Rainbow config: " + JSON.stringify(rainbowConfig));
            print("Iridescent config: " + JSON.stringify(iridescentConfig));
        }
    };
};

// Initialize the script
var instance = new ColorConfigExample();
instance.onAwake();
