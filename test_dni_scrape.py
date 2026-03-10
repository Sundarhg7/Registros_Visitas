import requests
from bs4 import BeautifulSoup

def test_eldni(dni):
    print("Testing eldni.com...")
    session = requests.Session()
    # GET to get token and cookies
    url = "https://eldni.com/pe/buscar-datos-por-dni"
    response = session.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    token_input = soup.find('input', {'name': '_token'})
    if not token_input:
        print("Could not find _token")
        return None
    token = token_input['value']
    
    # POST
    data = {
        '_token': token,
        'dni': dni
    }
    response = session.post(url, data=data)
    soup = BeautifulSoup(response.text, 'html.parser')
    # Look for the result table or span
    # Nombres
    # Apellido Paterno
    # Apellido Materno
    
    results = soup.find_all('td')
    if len(results) >= 4:
        dni_res = results[0].text.strip()
        nombres = results[1].text.strip()
        ap_pat = results[2].text.strip()
        ap_mat = results[3].text.strip()
        print(f"eldni result: DNI: {dni_res}, Nombres: {nombres}, Apellido Paterno: {ap_pat}, Apellido Materno: {ap_mat}")
        return {'nombres': nombres, 'apellidoPaterno': ap_pat, 'apellidoMaterno': ap_mat}
    else:
        print("eldni: Could not find results in table. Looking for other formats.")
        print(soup.text[:500])
        return None

def test_dniperu(dni):
    print("Testing dniperu.com...")
    session = requests.Session()
    url = "https://dniperu.com/buscar-dni-nombres-apellidos/"
    
    data = {
        'dni4': dni,
        'company': '',
        'buscar_dni': 'Buscar'
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = session.post(url, data=data, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    # Usually it's in an alert or a specific div
    # print(soup.text)
    
    # We can just look for the input values if it's filled, or table
    table = soup.find('table')
    if table:
        tds = table.find_all('td')
        if len(tds) >= 4:
            print("dniperu result found in table:", [t.text.strip() for t in tds])
            return True
        
    # Another common way
    inputs = soup.find_all('input')
    for inp in inputs:
        if inp.get('name') == 'nombre' or inp.get('id') == 'nombre':
            print("Found nombre input:", inp.get('value'))
    
    # Print out parts of text that might contain it
    text = soup.text
    if 'Nombres y Apellidos' in text or dni in text:
        print("Found DNI in text!")
        import re
        m = re.search(r'([A-Z\s]+)', text)
    
    return None

import sys
if len(sys.argv) > 1:
    dni = sys.argv[1]
    test_eldni(dni)
    test_dniperu(dni)
else:
    print("Please provide a DNI")
