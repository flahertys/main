ay # TradeHax - Test OpenAI API Key Validity (Windows PowerShell)
# This script tests your OpenAI API key without exposing it

Write-Host "🧪 Testing OpenAI API Key..." -ForegroundColor Cyan
Write-Host ""

$apiKey = $env:OPENAI_API_KEY

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Host "❌ ERROR: OPENAI_API_KEY environment variable not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Set in PowerShell:" -ForegroundColor White
    Write-Host '   $env:OPENAI_API_KEY = "sk-proj-YOUR_KEY_HERE"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Set in .env.local (recommended)" -ForegroundColor White
    Write-Host "   OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE" -ForegroundColor Cyan
    exit 1
}

Write-Host "Making request to: https://api.openai.com/v1/chat/completions" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $apiKey"
}

$body = @{
    model = "gpt-4-turbo-preview"
    messages = @(
        @{
            role = "user"
            content = "Write a short haiku about artificial intelligence. Keep it to exactly 3 lines."
        }
    )
    max_tokens = 100
    temperature = 0.7
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json

    if ($data.error) {
        Write-Host "❌ API Error:" -ForegroundColor Red
        Write-Host $data.error.message -ForegroundColor Red
        exit 1
    }

    if ($data.choices) {
        Write-Host "✅ API Key is VALID and working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response from GPT-4:" -ForegroundColor Cyan
        Write-Host "─────────────────────────────" -ForegroundColor Cyan
        Write-Host $data.choices[0].message.content -ForegroundColor White
        Write-Host "─────────────────────────────" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✅ Your OpenAI API integration is working correctly!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Tokens used:" -ForegroundColor Yellow
        Write-Host "  Prompt: $($data.usage.prompt_tokens)" -ForegroundColor White
        Write-Host "  Response: $($data.usage.completion_tokens)" -ForegroundColor White
        Write-Host "  Total: $($data.usage.total_tokens)" -ForegroundColor White
    } else {
        Write-Host "❌ Unexpected response format:" -ForegroundColor Red
        Write-Host $response.Content -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Request failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    # Try to extract error details
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor White
    }

    exit 1
}

