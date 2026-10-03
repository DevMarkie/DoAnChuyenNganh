Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem "C:\Users\minhn\Desktop\Giao_Dien_Web_SMS\*.png"
foreach ($f in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        $jpgPath = [System.IO.Path]::ChangeExtension($f.FullName, ".jpg")
        $img.Save($jpgPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $img.Dispose()
        Write-Host "Converted $($f.Name) to JPG"
    } catch {
        Write-Host "Failed to convert $($f.Name): $_"
    }
}
