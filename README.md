# FluturasInatorul
 In fiecare luna tata primeste fluturasul pe mail intr-o arhiva criptata cu parola X. Cum nu poate vedea direct in gmail fluturasul imi cere sa intru pe contul lui si sa il dezarvhez si sa il trimit inapoi in clar. 
 
 Un an mai tarziu cred ca a venit momentul sa automatizez acest mic frecuș computațional.

# Deploy

 Folosind vercel se leaga proiectul la repo-ul de git
 
 parola default a arhivei din api/extract.js se modifica din constanta PASSWORD

# Utilizare
1. Accesand https://fluturas-inatorul.vercel.app/ si incarcand o arhiva ZIP. Daca nu se mentioneaza o parola se va folosi constanta din PASSWORD Outputul va primul PDF din arhiva encoded base64
2. Trimitand un request de tip POST catre https://fluturas-inatorul.vercel.app/extract avand ca payload form-data sub forma
   file: '<fisier>'
Raspunsul primit va fi un JSON sub forma
  {" fisier PDF encoded as base64 "}
