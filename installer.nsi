!define PRODUCT_NAME "QRCodeGenerator"
!define PRODUCT_VERSION "1.0.0"  ; Update this with your app version
!define PRODUCT_PUBLISHER "Your Name"
!define PRODUCT_WEB_SITE "https://github.com/your-username/unboxd-wails-qrcode-generator-demo-3"

Name "${PRODUCT_NAME}"
OutFile "QRCodeGenerator-installer.exe"  ; This is overridden by /DOUTFILE in the workflow
InstallDir "$PROGRAMFILES\${PRODUCT_NAME}"
RequestExecutionLevel admin

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  File "installer\QRCodeGenerator.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\QRCodeGenerator.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
SectionEnd