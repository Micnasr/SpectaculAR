//@input Component.VFXComponent vfxComponent {"hint":"VFX Component to modify"}
//@input string[] colorParameters {"hint":"Array of VFX parameter names to modify"}
//@input string[] hexColorValues {"hint":"Array of hexadecimal color values (e.g., #FF0000, #00FF00, #0000FF)"}
//@input float cycleDuration {"hint":"Duration for each color in seconds", "default": 10.0}
//@input bool enableDebug {"hint":"Enable debug logging"}
//@input Component.Text displayText {"hint":"Text component to show current color info"}

var MultiColorCycler = function() {
    this.currentParameterIndex = 0;
    this.isCycling = false;
    this.cycleTimer = null;
    this.colorTimer = null;
    
    this.onAwake = function() {
        script.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    };

    this.onStart = function() {
        if (script.enableDebug) {
            print("MultiColorCycler started");
        }
        
        // Set default hex colors if none provided
        this.setDefaultColors();
        
        this.validateInputs();
        this.startColorCycling();
    };

    this.validateInputs = function() {
        if (!script.vfxComponent) {
            print("Error: VFX Component not assigned!");
            return false;
        }

        if (!script.vfxComponent.asset) {
            print("Error: VFX Asset not found on VFX Component!");
            return false;
        }

        if (!script.colorParameters || script.colorParameters.length === 0) {
            print("Error: No color parameters specified!");
            return false;
        }

        if (!script.hexColorValues || script.hexColorValues.length === 0) {
            print("Error: No hex color values specified!");
            return false;
        }

        // Ensure all arrays have the same length
        var paramCount = script.colorParameters.length;
        if (script.hexColorValues.length !== paramCount) {
            print("Error: Color parameters and hex color values arrays must have the same length!");
            return false;
        }

        return true;
    };

    this.setDefaultColors = function() {
        // Set default color parameters if none provided
        if (!script.colorParameters || script.colorParameters.length === 0) {
            script.colorParameters = [
                "3D Texture",
                "Color Ramp", 
                "Base Color",
                "Emission Color",
                "Tint Color"
            ];
        }
        
        // Generate beautiful random hex colors
        this.generateBeautifulRandomColors();
        
        if (script.enableDebug) {
            print("Using generated beautiful random colors:");
            print("Parameters: " + JSON.stringify(script.colorParameters));
            print("Hex Values: " + JSON.stringify(script.hexColorValues));
        }
    };

    this.generateBeautifulRandomColors = function() {
        var beautifulColors = [];
        var paramCount = script.colorParameters ? script.colorParameters.length : 5;
        
        for (var i = 0; i < paramCount; i++) {
            beautifulColors.push(this.generateBeautifulHexColor());
        }
        
        script.hexColorValues = beautifulColors;
    };

    this.generateBeautifulHexColor = function() {
        // Generate colors with higher saturation and brightness for more vibrant results
        var hue = Math.random() * 360;
        var saturation = 70 + Math.random() * 30; // 70-100% saturation
        var lightness = 40 + Math.random() * 40;  // 40-80% lightness
        
        return this.hslToHex(hue, saturation, lightness);
    };

    this.hslToHex = function(h, s, l) {
        // Convert HSL to RGB
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        var r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        // Convert RGB to hex
        var toHex = function(c) {
            var hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        
        return "#" + toHex(r) + toHex(g) + toHex(b);
    };

    this.startColorCycling = function() {
        if (!this.validateInputs()) {
            return;
        }

        this.isCycling = true;
        this.currentParameterIndex = 0;
        
        if (script.enableDebug) {
            print("Starting color cycling with " + script.colorParameters.length + " parameters");
        }

        this.applyCurrentColor();
        this.scheduleNextColor();
    };

    this.applyCurrentColor = function() {
        var paramName = script.colorParameters[this.currentParameterIndex];
        var hexValue = script.hexColorValues[this.currentParameterIndex];

        if (script.enableDebug) {
            print("Applying hex color to parameter: " + paramName);
            print("Hex Value: " + hexValue);
        }

        var color = this.parseHexColor(hexValue);
        
        if (color) {
            this.setVFXParameter(paramName, color);
            this.updateDisplayText(paramName, hexValue, color);
        } else {
            print("Error: Failed to parse hex color for parameter: " + paramName);
        }
    };

    // Removed parseColor function since we only use hex now

    this.parseHexColor = function(hex) {
        hex = hex.replace("#", "");
        
        if (!/^[0-9A-Fa-f]{6}$/.test(hex) && !/^[0-9A-Fa-f]{3}$/.test(hex)) {
            print("Invalid hex color format: " + hex);
            return null;
        }
        
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        
        var r = parseInt(hex.substr(0, 2), 16) / 255;
        var g = parseInt(hex.substr(2, 2), 16) / 255;
        var b = parseInt(hex.substr(4, 2), 16) / 255;
        
        return { r: r, g: g, b: b, a: 1.0 };
    };

    // Removed RGB, HSL, and named color parsing functions since we only use hex

    this.setVFXParameter = function(paramName, color) {
        try {
            var vfxProperties = script.vfxComponent.asset.properties;
            
            if (vfxProperties && vfxProperties[paramName] !== undefined) {
                // Convert color to vec4 for VFX
                var colorVec4 = new vec4(color.r, color.g, color.b, color.a);
                vfxProperties[paramName] = colorVec4;
                
                if (script.enableDebug) {
                    print("Set VFX parameter '" + paramName + "' to color: " + 
                          Math.round(color.r * 255) + ", " + 
                          Math.round(color.g * 255) + ", " + 
                          Math.round(color.b * 255));
                }
            } else {
                print("Error: VFX parameter '" + paramName + "' not found!");
                if (script.enableDebug) {
                    print("Available parameters: " + Object.keys(vfxProperties || {}).join(", "));
                }
            }
        } catch (error) {
            print("Error setting VFX parameter '" + paramName + "': " + error.message);
        }
    };

    this.updateDisplayText = function(paramName, hexValue, color) {
        if (script.displayText) {
            var info = "Parameter: " + paramName + "\n";
            info += "Hex Value: " + hexValue + "\n";
            info += "RGB: " + Math.round(color.r * 255) + ", " + 
                    Math.round(color.g * 255) + ", " + 
                    Math.round(color.b * 255) + "\n";
            info += "Time: " + (script.cycleDuration * this.currentParameterIndex) + "s - " + 
                    (script.cycleDuration * (this.currentParameterIndex + 1)) + "s";
            
            script.displayText.text = info;
        }
    };

    this.scheduleNextColor = function() {
        if (!this.isCycling) {
            return;
        }

        this.colorTimer = script.createEvent("DelayedCallbackEvent");
        this.colorTimer.bind(() => {
            // Generate new beautiful random color for current parameter
            var newColor = this.generateBeautifulHexColor();
            script.hexColorValues[this.currentParameterIndex] = newColor;
            
            if (script.enableDebug) {
                print("Generated new beautiful color for " + script.colorParameters[this.currentParameterIndex] + ": " + newColor);
            }
            
            // Apply the new color
            this.applyCurrentColor();
            
            // Move to next parameter
            this.currentParameterIndex = (this.currentParameterIndex + 1) % script.colorParameters.length;
            
            if (this.currentParameterIndex === 0) {
                if (script.enableDebug) {
                    print("Completed full parameter cycle, generating new colors for all parameters...");
                }
                // Generate new colors for all parameters when cycle completes
                this.generateBeautifulRandomColors();
            }
            
            this.scheduleNextColor();
        });
        
        this.colorTimer.enabled = true;
    };

    // Public methods
    this.stopCycling = function() {
        this.isCycling = false;
        if (this.colorTimer) {
            this.colorTimer.enabled = false;
        }
        print("Color cycling stopped");
    };

    this.resumeCycling = function() {
        if (!this.isCycling) {
            this.startColorCycling();
        }
    };

    this.setCurrentParameter = function(index) {
        if (index >= 0 && index < script.colorParameters.length) {
            this.currentParameterIndex = index;
            this.applyCurrentColor();
        }
    };

    this.getCurrentParameterIndex = function() {
        return this.currentParameterIndex;
    };

    this.getTotalParameters = function() {
        return script.colorParameters.length;
    };

    // Method to set custom hex colors
    this.setHexColors = function(hexValues) {
        if (hexValues && Array.isArray(hexValues)) {
            script.hexColorValues = hexValues;
            if (script.enableDebug) {
                print("Updated hex colors: " + JSON.stringify(hexValues));
            }
        } else {
            print("Error: Invalid hex values array provided");
        }
    };

    // Method to set custom color parameters
    this.setColorParameters = function(parameters) {
        if (parameters && Array.isArray(parameters)) {
            script.colorParameters = parameters;
            if (script.enableDebug) {
                print("Updated color parameters: " + JSON.stringify(parameters));
            }
        } else {
            print("Error: Invalid parameters array provided");
        }
    };

    // Method to set both parameters and colors at once
    this.setColorConfiguration = function(parameters, hexValues) {
        this.setColorParameters(parameters);
        this.setHexColors(hexValues);
    };

    // Method to generate new random beautiful colors
    this.generateNewRandomColors = function() {
        this.generateBeautifulRandomColors();
        if (script.enableDebug) {
            print("Generated new beautiful random colors: " + JSON.stringify(script.hexColorValues));
        }
    };

    // Method to generate a single random color for current parameter
    this.generateRandomColorForCurrent = function() {
        var newColor = this.generateBeautifulHexColor();
        script.hexColorValues[this.currentParameterIndex] = newColor;
        this.applyCurrentColor();
        
        if (script.enableDebug) {
            print("Generated new random color for " + script.colorParameters[this.currentParameterIndex] + ": " + newColor);
        }
        
        return newColor;
    };
};

// Initialize the script
var instance = new MultiColorCycler();
instance.onAwake();
