$imgDir = "c:/Users/odiva/Downloads/crush it/imagens_webp_crush_it"
$pairs = @(
    @{base="culturista-pergunta-4"; mw=733; mh=1373; fw=742; fh=1358},
    @{base="delgado-pergunta-4"; mw=683; mh=1476; fw=741; fh=1359},
    @{base="heroe-pergunta-4"; mw=744; mh=1354; fw=722; fh=1396},
    @{base="pesado"; mw=695; mh=1451; fw=748; fh=1348}
)

foreach ($p in $pairs) {
    $base = $p.base
    $ratio = $p.mw / $p.mh
    $fw = $p.fw
    $targetH = [int]($fw / $ratio)
    
    $path = Join-Path $imgDir ($base + "-w.webp")
    $out = Join-Path $imgDir ("temp_" + $base + "-w.webp")
    
    Write-Host "Processing $base-w.webp..."
    npx -y sharp-cli -i $path -o $out resize $fw $targetH --fit cover --position top
    if (Test-Path $out) {
        Move-Item -Path $out -Destination $path -Force
        Write-Host "Done $base-w.webp."
    }
}
Get-ChildItem -Path $imgDir -Filter "temp_*" | Remove-Item -Force
