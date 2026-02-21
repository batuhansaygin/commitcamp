# UI Flow Testing Script for CommitCamp
# This script opens browser windows for manual verification

$baseUrl = "http://localhost:3001"
$results = @()

Write-Host "=== CommitCamp E2E UI Test Script ===" -ForegroundColor Cyan
Write-Host "Opening browser windows for each test..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Forum Report
Write-Host "[1/8] Testing Forum Post Report Flow..." -ForegroundColor Green
Start-Process "chrome" "$baseUrl/forum"
Start-Sleep -Seconds 2
$results += @{
    Test = "Forum Post Report"
    URL = "$baseUrl/forum"
    Instructions = "1. Click any post, 2. Click Report button, 3. Submit report"
    Status = "MANUAL_CHECK"
}

# Test 2: Snippet Report
Write-Host "[2/8] Testing Snippet Report Flow..." -ForegroundColor Green
Start-Process "chrome" "$baseUrl/snippets"
Start-Sleep -Seconds 2
$results += @{
    Test = "Snippet Report"
    URL = "$baseUrl/snippets"
    Instructions = "1. Click any snippet, 2. Click Report button, 3. Submit report"
    Status = "MANUAL_CHECK"
}

# Test 3: Comment Report
Write-Host "[3/8] Testing Comment Report Flow..." -ForegroundColor Green
$results += @{
    Test = "Comment Report"
    URL = "$baseUrl/forum/[post-id]"
    Instructions = "1. Open post with comments, 2. Verify Report on other's comment, 3. Verify NO Report on own comment"
    Status = "MANUAL_CHECK"
}

# Test 4: Post Liked-By Modal
Write-Host "[4/8] Testing Post Liked-By Modal..." -ForegroundColor Green
$results += @{
    Test = "Post Liked-By Modal"
    URL = "$baseUrl/forum"
    Instructions = "1. Find post with likes, 2. Click like COUNT number, 3. Verify modal opens"
    Status = "MANUAL_CHECK"
}

# Test 5: Snippet Liked-By Modal
Write-Host "[5/8] Testing Snippet Liked-By Modal..." -ForegroundColor Green
$results += @{
    Test = "Snippet Liked-By Modal"
    URL = "$baseUrl/snippets"
    Instructions = "1. Find snippet with likes, 2. Click count, 3. Verify modal"
    Status = "MANUAL_CHECK"
}

# Test 6: Comment Like Interactions
Write-Host "[6/8] Testing Comment Like Interactions..." -ForegroundColor Green
$results += @{
    Test = "Comment Like Interactions"
    URL = "$baseUrl/forum/[post-id]"
    Instructions = "1. Like a comment, 2. Verify count updates, 3. Click count, 4. Verify modal"
    Status = "MANUAL_CHECK"
}

# Test 7: Reply Flow
Write-Host "[7/8] Testing Reply Flow..." -ForegroundColor Green
$results += @{
    Test = "Reply Flow & Nested Rendering"
    URL = "$baseUrl/forum/[post-id]"
    Instructions = "1. Click Reply on comment, 2. Submit reply, 3. Verify nested/indented rendering"
    Status = "MANUAL_CHECK"
}

# Test 8: Admin Reports Page
Write-Host "[8/8] Testing Admin Reports Page..." -ForegroundColor Green
Start-Process "chrome" "$baseUrl/admin/reports"
Start-Sleep -Seconds 2
$results += @{
    Test = "Admin Reports Page"
    URL = "$baseUrl/admin/reports"
    Instructions = "1. Verify page loads, 2. Check reports list, 3. Verify status dropdown, 4. Verify delete button"
    Status = "MANUAL_CHECK"
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""

foreach ($result in $results) {
    Write-Host "Test: $($result.Test)" -ForegroundColor Yellow
    Write-Host "  URL: $($result.URL)" -ForegroundColor Gray
    Write-Host "  Instructions: $($result.Instructions)" -ForegroundColor Gray
    Write-Host "  Status: $($result.Status)" -ForegroundColor Magenta
    Write-Host ""
}

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Follow the instructions in each browser window" -ForegroundColor White
Write-Host "2. Mark each test as PASS or FAIL" -ForegroundColor White
Write-Host "3. Document any blockers or errors encountered" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
