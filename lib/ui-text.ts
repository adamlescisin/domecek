export interface UiStrings {
  page_title: string;
  page_subtitle: string;
  basket_btn: string;
  basket_title: string;
  basket_empty: string;
  total: string;
  pay_btn: string;
  payment_title: string;
  order_summary: string;
  email_label: string;
  email_placeholder: string;
  email_error: string;
  continue_btn: string;
  back_to_basket: string;
  other_section: string;
  add_btn: string;
  success_title: string;
  success_subtitle: string;
  back_to_shop: string;
  connection_error: string;
  load_error: string;
  refresh_btn: string;
  no_items: string;
}

export const DEFAULT_STRINGS: UiStrings = {
  page_title:       'Vyberte si služby',
  page_subtitle:    'Přidejte položky do košíku a plaťte kartou, Apple Pay nebo Google Pay.',
  basket_btn:       'Košík',
  basket_title:     'Košík',
  basket_empty:     'Košík je prázdný',
  total:            'Celkem',
  pay_btn:          'Zaplatit',
  payment_title:    'Platba',
  order_summary:    'Shrnutí objednávky',
  email_label:      'E-mail pro potvrzení objednávky',
  email_placeholder:'vas@email.cz',
  email_error:      'Zadejte platnou e-mailovou adresu',
  continue_btn:     'Pokračovat k platbě',
  back_to_basket:   'Zpět do košíku',
  other_section:    'Ostatní',
  add_btn:          'Přidat',
  success_title:    'Děkujeme! Platba proběhla úspěšně.',
  success_subtitle: 'Potvrzení posíláme na váš email.',
  back_to_shop:     'Zpět na výběr',
  connection_error: 'Chyba připojení. Zkuste to znovu.',
  load_error:       'Nepodařilo se načíst položky. Zkuste obnovit stránku.',
  refresh_btn:      'Obnovit',
  no_items:         'Momentálně nejsou k dispozici žádné položky.',
};

export const UI_TEXT_FIELDS: { key: keyof UiStrings; label: string }[] = [
  { key: 'page_title',        label: 'Nadpis stránky' },
  { key: 'page_subtitle',     label: 'Podnázev stránky' },
  { key: 'basket_btn',        label: 'Tlačítko košíku (header)' },
  { key: 'basket_title',      label: 'Název košíku (drawer)' },
  { key: 'basket_empty',      label: 'Prázdný košík' },
  { key: 'add_btn',           label: 'Tlačítko Přidat' },
  { key: 'total',             label: 'Celkem' },
  { key: 'pay_btn',           label: 'Tlačítko Zaplatit' },
  { key: 'payment_title',     label: 'Název platební sekce' },
  { key: 'order_summary',     label: 'Shrnutí objednávky' },
  { key: 'email_label',       label: 'Popisek e-mailu' },
  { key: 'email_placeholder', label: 'Placeholder e-mailu' },
  { key: 'email_error',       label: 'Chyba e-mailu (validace)' },
  { key: 'continue_btn',      label: 'Tlačítko Pokračovat k platbě' },
  { key: 'back_to_basket',    label: 'Zpět do košíku' },
  { key: 'other_section',     label: 'Sekce "Ostatní"' },
  { key: 'success_title',     label: 'Potvrzení – nadpis' },
  { key: 'success_subtitle',  label: 'Potvrzení – podnázev' },
  { key: 'back_to_shop',      label: 'Zpět na výběr' },
  { key: 'load_error',        label: 'Chyba načítání' },
  { key: 'refresh_btn',       label: 'Tlačítko Obnovit' },
  { key: 'no_items',          label: 'Žádné položky k dispozici' },
  { key: 'connection_error',  label: 'Chyba připojení (platba)' },
];
