package main

import (
	"embed"
	"encoding/base64"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon/appicon.ico
var icon []byte

func main() {
	app := NewApp()
	err := wails.Run(&options.App{
		Title:  "QR Code Generator",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Linux: &linux.Options{
			Icon: icon, // Embed the ICO directly
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}

func (a *App) SaveFile(filename string, base64Data string) bool {
	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: filename,
		Title:           "Save QR Codes ZIP",
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP Files (*.zip)", Pattern: "*.zip"},
		},
	})
	if err != nil || savePath == "" {
		runtime.LogError(a.ctx, "Failed to get save path: "+err.Error())
		return false
	}

	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		runtime.LogError(a.ctx, "Failed to decode base64 data: "+err.Error())
		return false
	}

	err = os.WriteFile(savePath, data, 0644)
	if err != nil {
		runtime.LogError(a.ctx, "Failed to write file: "+err.Error())
		return false
	}

	return true
}
