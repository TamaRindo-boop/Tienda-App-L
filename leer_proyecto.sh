#!/bin/bash

# Archivo de salida donde se guardará todo el código
OUTPUT_FILE="codebase_completo.txt"

# Limpiar el archivo si ya existía
> "$OUTPUT_FILE"

echo "=== EMPEZANDO A LEER EL PROYECTO ==="

# Buscar archivos de código ignorando node_modules, git y el propio archivo de salida
find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.css" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "./$OUTPUT_FILE" \
  -not -path "./leer_proyecto.sh" | while read -r file; do
    
    echo "Procesando: $file"
    echo -e "\n\n========================================" >> "$OUTPUT_FILE"
    echo "Ruta del archivo: $file" >> "$OUTPUT_FILE"
    echo -e "========================================\n" >> "$OUTPUT_FILE"
    
    # Copiar el contenido del archivo de código
    cat "$file" >> "$OUTPUT_FILE"
done

echo "======================================="
echo "¡Listo! Todo tu proyecto se ha guardado en: $OUTPUT_FILE"
echo "======================================="
