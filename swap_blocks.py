
import sys

file_path = r'c:\Users\odiva\Downloads\crush it\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Exact blocks to swap
status_box_start = content.find('<div class="status-box reveal reveal-left delay-2">')
# Find the end of status_box
status_box_end = content.find('            </div>', status_box_start + 50) + 18

comparison_row_start = content.find('<div class="comparison-row reveal reveal-right delay-3">')
comparison_row_end = content.find('            </div>', content.find('<div class="muscle-bars">', comparison_row_start + 100))
# Let's be safer and find the exact closing tag for comparison-row
# comparison-row contains two comp-card divs.
comp_card_2 = content.find('<div class="comp-card highlight-card">', comparison_row_start + 50)
end_of_comp_card_2 = content.find('</div>\n                </div>', comp_card_2) + 30
comparison_row_end = content.find('</div>', end_of_comp_card_2) + 6

# Let's extract the blocks safely
status_block = content[status_box_start:comparison_row_start]
comparison_block = content[comparison_row_start:content.find('            <h2 class="headline"', comparison_row_start)]

# Swap them in the content
new_content = content[:status_box_start] + comparison_block + status_block + content[content.find('            <h2 class="headline"', comparison_row_start):]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Swapped using python script")
