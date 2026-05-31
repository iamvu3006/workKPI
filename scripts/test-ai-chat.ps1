# Test POST /api/ai/chat
# Lấy cookie từ browser nếu cần, hoặc test bằng PowerShell session

$baseUrl = "http://localhost:3000"
$chatUrl = "$baseUrl/api/ai/chat"

$body = @{
    message = "Xin chào! Bạn có thể giúp gì cho tôi?"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $resp = Invoke-WebRequest -Uri $chatUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "HTTP Status:" $resp.StatusCode
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "Success:" $data.success
    Write-Host "Message:" $data.message
    if ($data.data) {
        Write-Host "AI Reply:" $data.data.messages[-1].content
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "FAILED - HTTP $statusCode"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Response:" $reader.ReadToEnd()
}
