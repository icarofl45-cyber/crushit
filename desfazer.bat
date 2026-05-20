@echo off
echo ==============================================
echo RECONSTRUINDO E RESTAURANDO BACKUP DO CSS...
echo ==============================================
copy /Y "css\style_BACKUP_20maio.css" "css\style.css"
if %errorlevel% equ 0 (
    echo [SUCESSO] O arquivo style.css foi restaurado com sucesso para o estado original!
) else (
    echo [ERRO] Ocorreu um erro ao restaurar o backup. Por favor, verifique manualmente.
)
pause
