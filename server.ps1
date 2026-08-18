$root = 'c:\Users\infin\Desktop\新建文件夹\cat-battle'
$port = 3004
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.svg'  = 'image/svg+xml'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "HTTP server on port $port"

while ($true) {
  $client = $listener.AcceptTcpClient()
  $ns = $client.GetStream()

  # Read request with a single blocking read
  $buffer = New-Object byte[] 8192
  $n = $ns.Read($buffer, 0, $buffer.Length)

  if ($n -gt 0) {
    $requestStr = [Text.Encoding]::ASCII.GetString($buffer, 0, $n)
    $lines = $requestStr -split "`r`n"
    $requestLine = $lines[0]

    if ($requestLine) {
      $parts = $requestLine -split ' '
      $path = $parts[1]
      if ($path -eq '/') { $path = '/index.html' }

      $file = Join-Path $root $path.TrimStart('/') -replace '/', '\'
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $ct = $mime[$ext]
      if (!$ct) { $ct = 'application/octet-stream' }

      if (Test-Path $file -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $header = "HTTP/1.0 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
        $ns.Write($headerBytes, 0, $headerBytes.Length)
        $ns.Write($bytes, 0, $bytes.Length)
      } else {
        $body = 'Not Found'
        $header = "HTTP/1.0 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n$body"
        $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
        $ns.Write($headerBytes, 0, $headerBytes.Length)
      }
    }
  }

  $ns.Flush()
  $client.Close()
}