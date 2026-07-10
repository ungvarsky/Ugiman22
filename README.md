# Generátor zmluvy o výpožičke

Univerzálny webový formulár na vytvorenie zmluvy o výpožičke (§ 659 a nasl. Občianskeho zákonníka) s exportom do PDF.

## Použitie

1. Otvorte `index.html` v prehliadači (dvojklikom, alebo cez lokálny server).
2. Vyplňte údaje o požičiavateľovi a vypožičiavateľovi (fyzická osoba, fyzická osoba – podnikateľ alebo právnická osoba).
3. Vyplňte predmet výpožičky, dobu, účel a prípadné ďalšie dojednania.
4. Kliknite na **„Zobraziť náhľad“** pre kontrolu textu zmluvy.
5. Kliknite na **„Stiahnuť PDF“** — vygeneruje sa a stiahne hotová zmluva vo formáte PDF.

Formulár je čisto klientský (HTML/CSS/JS), nevyžaduje žiadny backend ani inštaláciu. Pre export PDF je pri prvom otvorení potrebné pripojenie na internet (načítanie knižníc jsPDF a html2canvas z CDN).
