$srcDir = "graphis 2d"
$outDir = Join-Path $srcDir "optimized"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$inputPath,
        [string]$outputPath,
        [int]$maxSize
    )
    $img = [System.Drawing.Image]::FromFile($inputPath)
    try {
        $ratio = [Math]::Min($maxSize / $img.Width, $maxSize / $img.Height)
        if ($ratio -gt 1) { $ratio = 1 }
        $newW = [int][Math]::Round($img.Width * $ratio)
        $newH = [int][Math]::Round($img.Height * $ratio)
        $bmp = New-Object System.Drawing.Bitmap $newW, $newH
        $bmp.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($img, 0, 0, $newW, $newH)
        $g.Dispose()
        $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    } finally {
        $img.Dispose()
    }
}

$files = Get-ChildItem -Path $srcDir -File -Filter "*.png"
foreach ($file in $files) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $fullOut = Join-Path $outDir ($base + "-full.png")
    $thumbOut = Join-Path $outDir ($base + "-thumb.png")
    Resize-Image $file.FullName $fullOut 1600
    Resize-Image $file.FullName $thumbOut 600
}
