param(
    [int]$Port = 8002,
    [string]$HostName = "localhost",
    [switch]$Https
)

$scheme = if ($Https.IsPresent) { "https" } else { "http" }
$prefix = ("{0}://{1}:{2}/" -f $scheme, $HostName, $Port)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Server started at $prefix"

$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".mjs"  = "application/javascript"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".mp4"  = "video/mp4"
    ".webm" = "video/webm"
    ".mp3"  = "audio/mpeg"
    ".wav"  = "audio/wav"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".json" = "application/json"
    ".glb"  = "model/gltf-binary"
}

function Add-SecurityHeaders {
    param([System.Net.HttpListenerResponse]$Response)
    $Response.Headers["X-Content-Type-Options"] = "nosniff"
    $Response.Headers["X-Frame-Options"] = "DENY"
    $Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    $Response.Headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
    $csp = @(
        "default-src 'self'",
        "script-src 'self' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
    ) -join "; "
    $Response.Headers["Content-Security-Policy"] = $csp
    if ($scheme -eq "https") {
        $Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    }
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        Add-SecurityHeaders -Response $response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        
        $unsafePath = Join-Path $PSScriptRoot $path.TrimStart('/')
        $filePath = [System.IO.Path]::GetFullPath($unsafePath)

        $rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot)
        if (-not $filePath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            if ($mimeTypes.ContainsKey($extension)) {
                $contentType = $mimeTypes[$extension]
            }

            $response.ContentType = $contentType
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
}
