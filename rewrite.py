import re
import os

filepath = 'components/app-provider.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

if 'import { createClient }' not in code:
    code = code.replace('import { usePathname }', 'import { usePathname }\nimport { createClient } from "@/lib/supabase/client";')

