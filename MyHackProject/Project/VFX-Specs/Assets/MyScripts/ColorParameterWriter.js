//@input string colorMode {"hint":"Color mode: 'hex', 'rgb', 'hsl', 'named'"}
//@input string colorValue {"hint":"Color value based on mode"}
//@input bool enableDebug {"hint":"Enable debug logging"}
//@input Component.Text textComponent {"hint":"Text component to display colors"}

var ColorParameterWriter = function() {
    this.onAwake = function() {
        script.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    };

    this.onStart = function() {
        if (script.enableDebug) {
            print("ColorParameterWriter started");
        }
        
        this.processColorParameters();
    };

    this.processColorParameters = function() {
        var colorMode = script.colorMode || "hex";
        var colorValue = script.colorValue || "#FF0000";
        
        if (script.enableDebug) {
            print("Processing color - Mode: " + colorMode + ", Value: " + colorValue);
        }
        
        var color = this.parseColor(colorMode, colorValue);
        
        if (color) {
            this.applyColor(color);
            this.displayColorInfo(colorMode, colorValue, color);
        } else {
            print("Error: Invalid color parameters");
        }
    };

    this.parseColor = function(mode, value) {
        switch (mode.toLowerCase()) {
            case "hex":
                return this.parseHexColor(value);
            case "rgb":
                return this.parseRgbColor(value);
            case "hsl":
                return this.parseHslColor(value);
            case "named":
                return this.parseNamedColor(value);
            default:
                print("Unknown color mode: " + mode);
                return null;
        }
    };

    this.parseHexColor = function(hex) {
        // Remove # if present
        hex = hex.replace("#", "");
        
        // Validate hex format
        if (!/^[0-9A-Fa-f]{6}$/.test(hex) && !/^[0-9A-Fa-f]{3}$/.test(hex)) {
            print("Invalid hex color format: " + hex);
            return null;
        }
        
        // Convert 3-digit hex to 6-digit
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        
        // Convert to RGB
        var r = parseInt(hex.substr(0, 2), 16) / 255;
        var g = parseInt(hex.substr(2, 2), 16) / 255;
        var b = parseInt(hex.substr(4, 2), 16) / 255;
        
        return { r: r, g: g, b: b, a: 1.0 };
    };

    this.parseRgbColor = function(rgb) {
        // Parse "rgb(255, 0, 0)" or "255, 0, 0" format
        var match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
        
        if (!match) {
            print("Invalid RGB format: " + rgb);
            return null;
        }
        
        var r = parseInt(match[1]) / 255;
        var g = parseInt(match[2]) / 255;
        var b = parseInt(match[3]) / 255;
        
        return { r: r, g: g, b: b, a: 1.0 };
    };

    this.parseHslColor = function(hsl) {
        // Parse "hsl(360, 100%, 50%)" format
        var match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        
        if (!match) {
            print("Invalid HSL format: " + hsl);
            return null;
        }
        
        var h = parseInt(match[1]) / 360;
        var s = parseInt(match[2]) / 100;
        var l = parseInt(match[3]) / 100;
        
        // Convert HSL to RGB
        return this.hslToRgb(h, s, l);
    };

    this.parseNamedColor = function(name) {
        var namedColors = {
            "red": { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },
            "green": { r: 0.0, g: 1.0, b: 0.0, a: 1.0 },
            "blue": { r: 0.0, g: 0.0, b: 1.0, a: 1.0 },
            "yellow": { r: 1.0, g: 1.0, b: 0.0, a: 1.0 },
            "cyan": { r: 0.0, g: 1.0, b: 1.0, a: 1.0 },
            "magenta": { r: 1.0, g: 0.0, b: 1.0, a: 1.0 },
            "white": { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
            "black": { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            "orange": { r: 1.0, g: 0.5, b: 0.0, a: 1.0 },
            "purple": { r: 0.5, g: 0.0, b: 0.5, a: 1.0 },
            "pink": { r: 1.0, g: 0.75, b: 0.8, a: 1.0 },
            "brown": { r: 0.6, g: 0.3, b: 0.0, a: 1.0 },
            "gray": { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            "lime": { r: 0.5, g: 1.0, b: 0.0, a: 1.0 },
            "navy": { r: 0.0, g: 0.0, b: 0.5, a: 1.0 },
            "teal": { r: 0.0, g: 0.5, b: 0.5, a: 1.0 }
        };
        
        var color = namedColors[name.toLowerCase()];
        if (!color) {
            print("Unknown named color: " + name);
            return null;
        }
        
        return color;
    };

    this.hslToRgb = function(h, s, l) {
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
        
        return { r: r, g: g, b: b, a: 1.0 };
    };

    this.applyColor = function(color) {
        // Apply color to text component if available
        if (script.textComponent) {
            script.textComponent.textFill = new vec4(color.r, color.g, color.b, color.a);
            if (script.enableDebug) {
                print("Applied color to text component");
            }
        }
        
        // You can extend this to apply color to other components
        // For example, material color, VFX parameters, etc.
    };

    this.displayColorInfo = function(mode, value, color) {
        var info = "Color Mode: " + mode + "\n";
        info += "Input Value: " + value + "\n";
        info += "RGB Values: " + Math.round(color.r * 255) + ", " + Math.round(color.g * 255) + ", " + Math.round(color.b * 255) + "\n";
        info += "Normalized: " + color.r.toFixed(3) + ", " + color.g.toFixed(3) + ", " + color.b.toFixed(3);
        
        print(info);
        
        // Update text component if available
        if (script.textComponent) {
            script.textComponent.text = info;
        }
    };

    // Public methods for external access
    this.setColor = function(mode, value) {
        script.colorMode = mode;
        script.colorValue = value;
        this.processColorParameters();
    };

    this.getRandomColor = function() {
        var modes = ["hex", "rgb", "hsl", "named"];
        var mode = modes[Math.floor(Math.random() * modes.length)];
        var value;
        
        switch (mode) {
            case "hex":
                value = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                break;
            case "rgb":
                var r = Math.floor(Math.random() * 256);
                var g = Math.floor(Math.random() * 256);
                var b = Math.floor(Math.random() * 256);
                value = r + ", " + g + ", " + b;
                break;
            case "hsl":
                var h = Math.floor(Math.random() * 360);
                var s = Math.floor(Math.random() * 101);
                var l = Math.floor(Math.random() * 101);
                value = "hsl(" + h + ", " + s + "%, " + l + "%)";
                break;
            case "named":
                var names = ["red", "green", "blue", "yellow", "cyan", "magenta", "white", "black", "orange", "purple", "pink", "brown", "gray", "lime", "navy", "teal"];
                value = names[Math.floor(Math.random() * names.length)];
                break;
        }
        
        this.setColor(mode, value);
    };
};

// Initialize the script
var instance = new ColorParameterWriter();
instance.onAwake();
