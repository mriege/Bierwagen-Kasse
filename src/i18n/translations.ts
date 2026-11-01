export type TranslationKey =
  | 'tabs.order'
  | 'tabs.config'
  | 'header.newOrder'
  | 'header.resetAll'
  | 'header.resetAllConfirm'
  | 'header.storno'
  | 'header.stornoActive'
  | 'header.soundOn'
  | 'header.soundOff'
  | 'header.privacy'
  | 'header.bilanz'
  | 'banner.stornoMode'
  | 'order.title'
  | 'order.empty'
  | 'order.emptyHint'
  | 'order.tap'
  | 'order.unitLabel'
  | 'order.removePosition'
  | 'order.minusOne'
  | 'order.plusOne'
  | 'pfand.return'
  | 'pfand.unitLabel'
  | 'totalbar.drinks'
  | 'totalbar.pfand'
  | 'totalbar.return'
  | 'totalbar.cash'
  | 'totalbar.tip'
  | 'totalbar.total'
  | 'totalbar.given'
  | 'totalbar.change'
  | 'totalbar.exact'
  | 'cash.given'
  | 'cash.cancel'
  | 'cash.confirm'
  | 'cash.customAmount'
  | 'cash.title'
  | 'tip.label'
  | 'tip.plus50'
  | 'tip.plus1'
  | 'tip.roundUp5'
  | 'tip.roundUp10'
  | 'tip.clear'
  | 'drink.noPfand'
  | 'drink.outOfStock'
  | 'drink.stockLeft'
  | 'config.toolbar.hint'
  | 'config.export'
  | 'config.import'
  | 'config.imported'
  | 'config.pfandCategories'
  | 'config.drinks'
  | 'config.newPfand'
  | 'config.newDrink'
  | 'config.subTabSortiment'
  | 'config.subTabSettings'
  | 'config.subTabData'
  | 'config.dataDanger'
  | 'config.add'
  | 'config.label'
  | 'config.amount'
  | 'config.size'
  | 'config.price'
  | 'config.icon'
  | 'config.pfandType'
  | 'config.noPfand'
  | 'config.happyHour'
  | 'config.startTime'
  | 'config.endTime'
  | 'config.priceEur'
  | 'config.save'
  | 'config.discard'
  | 'config.delete'
  | 'config.noDrinks'
  | 'config.noPfandTypes'
  | 'config.stockTitle'
  | 'config.stockHint'
  | 'config.stockStart'
  | 'config.stockUnlimited'
  | 'settings.title'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.themeDark'
  | 'settings.themeLight'
  | 'settings.features'
  | 'settings.featureTip'
  | 'settings.featureTipHint'
  | 'settings.featureBilanz'
  | 'settings.featureBilanzHint'
  | 'settings.featureStock'
  | 'settings.featureStockHint'
  | 'settings.cashStart'
  | 'settings.cashStartHint'
  | 'bilanz.title'
  | 'bilanz.empty'
  | 'bilanz.entries'
  | 'bilanz.start'
  | 'bilanz.summary'
  | 'bilanz.gross'
  | 'bilanz.tipsTotal'
  | 'bilanz.expectedDrawer'
  | 'bilanz.entryAt'
  | 'bilanz.editEntry'
  | 'bilanz.deleteEntry'
  | 'bilanz.deleteAll'
  | 'bilanz.deleteAllConfirm'
  | 'bilanz.itemsCount'
  | 'bilanz.payment'
  | 'bilanz.paymentCash'
  | 'bilanz.paymentCard'
  | 'bilanz.paymentOther'
  | 'bilanz.byProduct'
  | 'bilanz.unitsSold'
  | 'bilanz.export'
  | 'bilanz.exportHint'
  | 'bilanz.print'
  | 'bilanz.printHint'
  | 'config.bilanzBackupTitle'
  | 'config.bilanzBackupHint'
  | 'config.bilanzExport'
  | 'config.bilanzImport'
  | 'config.bilanzImported'
  | 'config.bilanzImportConfirmTitle'
  | 'config.bilanzImportConfirmBody'
  | 'config.bilanzImportConfirm'
  | 'config.sortimentBackupTitle'
  | 'config.sortimentBackupHint'
  | 'modal.close'
  | 'modal.understand'
  | 'common.yes'
  | 'common.no'
  | 'common.save'
  | 'common.cancel'
  | 'config.subTabSync'
  | 'sync.title'
  | 'sync.idle'
  | 'sync.role.master'
  | 'sync.role.joiner'
  | 'sync.startMaster'
  | 'sync.joinAsClient'
  | 'sync.cancelPairing'
  | 'sync.disconnect'
  | 'sync.peers'
  | 'sync.scanInstruction'
  | 'sync.showOfferQr'
  | 'sync.showAnswerQr'
  | 'sync.scanOffer'
  | 'sync.scanAnswer'
  | 'sync.connected'
  | 'sync.connectingHint'
  | 'sync.intro'
  | 'sync.privacyHint'
  | 'sync.statusBadge'
  | 'sync.errorScan'
  | 'sync.adoptShared'
  | 'sync.session'
  | 'sync.notReady'
  | 'sync.joinerReadOnly'
  | 'sync.peerLabel'
  | 'sync.peerSince'
  | 'sync.kickPeer'
  | 'sync.kickConfirm'
  | 'sync.deviceNameLabel'
  | 'sync.deviceNamePlaceholder'
  | 'sync.deviceNameHint'
  | 'sync.openGuide'
  | 'guide.title'
  | 'guide.subtitle'
  | 'guide.prereqTitle'
  | 'guide.prereqWifi'
  | 'guide.prereqCamera'
  | 'guide.prereqBrowser'
  | 'guide.s1Title'
  | 'guide.s1Body'
  | 'guide.s2Title'
  | 'guide.s2Body'
  | 'guide.s2Hint'
  | 'guide.s3Title'
  | 'guide.s3Body'
  | 'guide.s3Hint'
  | 'guide.s4Title'
  | 'guide.s4Body'
  | 'guide.s5Title'
  | 'guide.s5Body'
  | 'guide.s5b1'
  | 'guide.s5b2'
  | 'guide.s5b3'
  | 'guide.moreDevicesTitle'
  | 'guide.moreDevicesBody'
  | 'guide.troubleTitle'
  | 'guide.troubleQ1'
  | 'guide.troubleA1'
  | 'guide.troubleQ2'
  | 'guide.troubleA2'
  | 'guide.troubleQ3'
  | 'guide.troubleA3'
  | 'guide.troubleQ4'
  | 'guide.troubleA4'
  | 'guide.privacyTitle'
  | 'guide.privacyBody'
  | 'sync.displaySection'
  | 'sync.displaySectionHint'
  | 'sync.pairDisplay'
  | 'sync.becomeDisplay'
  | 'sync.showDisplayOfferQr'
  | 'sync.displayScanInstruction'
  | 'sync.channelSync'
  | 'sync.channelDisplay'
  | 'display.title'
  | 'display.intro'
  | 'display.scanCashier'
  | 'display.showAnswer'
  | 'display.showAnswerHint'
  | 'display.cancelPairing'
  | 'display.connected'
  | 'display.waiting'
  | 'display.exit'
  | 'display.exitConfirm'
  | 'display.welcome'
  | 'display.welcomeHint'
  | 'display.currentOrder'
  | 'display.enterFullscreen'
  | 'display.exitFullscreen'
  | 'sync.reconnectTitle'
  | 'sync.reconnectMasterBody'
  | 'sync.reconnectJoinerBody'
  | 'sync.reconnectDisplayBody'
  | 'sync.reconnectMasterQrReady'
  | 'sync.reconnectMasterPreparing'
  | 'sync.reconnectScanCta'
  | 'sync.reconnectDismiss'
  | 'sync.reconnectAgo'
  | 'sync.reconnectJustNow'
  | 'display.reconnectTitle'
  | 'display.reconnectBody'
  | 'display.reconnectCta'
  | 'display.reconnectDismiss'
  | 'sync.displaySingular'
  | 'sync.displayPlural'
  | 'sync.pairAnotherDisplay'
  | 'sync.displayOnlyActive'
  | 'nav.label'
  | 'nav.order'
  | 'nav.bilanz'
  | 'nav.sortiment'
  | 'nav.devices'
  | 'nav.settings'
  | 'sale.complete'
  | 'sale.done'
  | 'sale.discard'
  | 'sale.discardOrder'
  | 'sale.discarded'
  | 'sale.undo'
  | 'sale.itemsOne'
  | 'sale.itemsMany'
  | 'sale.noItems'
  | 'sale.payout'
  | 'totalbar.missing'
  | 'drink.a11yInOrder'
  | 'drink.addMany'
  | 'tip.roundTo'
  | 'tip.custom'
  | 'numpad.tipTitle'
  | 'numpad.newTotal'
  | 'numpad.baseTotal'
  | 'numpad.input'
  | 'numpad.comma'
  | 'numpad.backspace'
  | 'numpad.apply'
  | 'settings.themeSystem'
  | 'settings.themeHint'
  | 'settings.sound'
  | 'settings.soundHint'
  | 'settings.keepAwake'
  | 'settings.keepAwakeHint'
  | 'settings.legal'
  | 'settings.about'
  | 'settings.privacy'
  | 'settings.imprint'
  | 'settings.version'
  | 'config.deleteConfirm'
  | 'config.dangerTitle'
  | 'config.fileError'
  | 'bilanz.disabledTitle'
  | 'bilanz.disabledBody'
  | 'bilanz.enable'
  | 'bilanz.joinerTitle'
  | 'bilanz.joinerBody'
  | 'app.loadError'
  | 'app.reload'
  | 'scanner.hint'
  | 'scanner.pasteLabel'
  | 'scanner.pasteHint'
  | 'scanner.pasteSubmit'
  | 'scanner.errDenied'
  | 'scanner.errNoCamera'
  | 'scanner.errGeneric'
  | 'sync.startMasterHint'
  | 'sync.joinHint'
  | 'sync.addDevice'
  | 'sync.answerInstruction'
  | 'sync.copyCode'
  | 'sync.codeCopied'
  | 'sync.preparing'
  | 'sync.connecting'
  | 'sync.connectingBody'
  | 'sync.peerSynced'
  | 'sync.peerUnstable'
  | 'sync.peerVersion'
  | 'sync.chipConnected'
  | 'sync.chipError'
  | 'sync.chipPairing'
  | 'sync.chipUnstable'
  | 'sync.bannerTitle'
  | 'sync.bannerBody'
  | 'sync.bannerAction'
  | 'sync.sinceMinutes'
  | 'sync.sinceHours'
  | 'sync.reconnectSafe'
  | 'sync.reconnectShowCta'
  | 'sync.diagnostics'
  | 'sync.diagnosticsCopied'
  | 'sync.err.qr-invalid'
  | 'sync.err.qr-outdated'
  | 'sync.err.qr-newer'
  | 'sync.err.qr-expected-offer'
  | 'sync.err.qr-expected-answer'
  | 'sync.err.qr-wrong-mode'
  | 'sync.err.session-mismatch'
  | 'sync.err.no-pairing'
  | 'sync.err.role-conflict'
  | 'sync.err.webrtc-unavailable'
  | 'sync.err.no-candidates'
  | 'sync.err.connect-timeout'
  | 'sync.err.connect-failed'
  | 'sync.err.unknown';

export type Translations = Record<TranslationKey, string>;

export const de: Translations = {
  'tabs.order': 'Bestellung',
  'tabs.config': 'Konfiguration',
  'header.newOrder': 'Neue Bestellung',
  'header.resetAll': 'Alles zurücksetzen',
  'header.resetAllConfirm': 'Wirklich alles löschen?',
  'header.storno': 'Storno',
  'header.stornoActive': 'Storno aktiv',
  'header.soundOn': 'Sound an',
  'header.soundOff': 'Sound aus',
  'header.privacy': 'Datenschutz-Information',
  'header.bilanz': 'Tagesbilanz',
  'banner.stornoMode': 'Storno-Modus: Tippen entfernt 1 Stück',
  'order.title': 'Bestellung',
  'order.empty': 'Noch keine Bestellung',
  'order.emptyHint': 'Tippe auf ein Getränk.',
  'order.tap': 'Tippen zum Öffnen',
  'order.unitLabel': '/ Stk',
  'order.removePosition': 'Position entfernen',
  'order.minusOne': 'Eins weniger',
  'order.plusOne': 'Eins mehr',
  'pfand.return': 'Pfand zurück',
  'pfand.unitLabel': '/ Stk',
  'totalbar.drinks': 'Getränke',
  'totalbar.pfand': '+ Pfand',
  'totalbar.return': '− Rückgabe',
  'totalbar.cash': 'Bargeld',
  'totalbar.tip': '+ Trinkgeld',
  'totalbar.total': 'Zu zahlen',
  'totalbar.given': 'Gegeben',
  'totalbar.change': 'Zurück',
  'totalbar.exact': 'Passend',
  'cash.given': 'Gegeben',
  'cash.cancel': 'Abbrechen',
  'cash.confirm': 'OK',
  'cash.customAmount': 'Eigenen Betrag eingeben',
  'cash.title': 'Bargeld vom Kunden',
  'tip.label': 'Trinkgeld',
  'tip.plus50': '+0,50 €',
  'tip.plus1': '+1 €',
  'tip.roundUp5': 'Auf 5 €',
  'tip.roundUp10': 'Auf 10 €',
  'tip.clear': 'Trinkgeld entfernen',
  'drink.noPfand': 'kein Pfand',
  'drink.outOfStock': 'leer',
  'drink.stockLeft': 'übrig',
  'config.toolbar.hint':
    'Alle Einstellungen werden lokal auf diesem Gerät gespeichert (localStorage + IndexedDB) und bleiben nach Reload erhalten — kein Cloud-Server.',
  'config.export': 'Sortiment exportieren',
  'config.import': 'Sortiment importieren',
  'config.imported': 'Sortiment importiert ✓',
  'config.sortimentBackupTitle': 'Sortiment sichern',
  'config.sortimentBackupHint':
    'Getränke- und Pfand-Liste als JSON sichern oder von einem anderen Gerät übernehmen.',
  'config.pfandCategories': 'Pfand-Kategorien',
  'config.drinks': 'Produkte',
  'config.newPfand': 'Neue Pfand-Kategorie',
  'config.newDrink': 'Neues Produkt',
  'config.subTabSortiment': 'Sortiment',
  'config.subTabSettings': 'Einstellungen',
  'config.subTabData': 'Daten',
  'config.dataDanger':
    'Achtung: „Alles zurücksetzen" löscht Sortiment, Einstellungen und Tagesbilanz unwiderruflich.',
  'config.add': 'Hinzufügen',
  'config.label': 'Bezeichnung',
  'config.amount': 'Betrag',
  'config.size': 'Größe',
  'config.price': 'Preis',
  'config.icon': 'Icon',
  'config.pfandType': 'Pfandtyp',
  'config.noPfand': 'Kein Pfand',
  'config.happyHour': 'Happy Hour',
  'config.startTime': 'Start',
  'config.endTime': 'Ende',
  'config.priceEur': 'Preis €',
  'config.save': 'Speichern',
  'config.discard': 'Verwerfen',
  'config.delete': 'Löschen',
  'config.noDrinks': 'Noch keine Getränke angelegt.',
  'config.noPfandTypes': 'Noch keine Pfand-Kategorien angelegt.',
  'config.stockTitle': 'Bestand',
  'config.stockHint': 'Anzahl verfügbar — leer für unbegrenzt.',
  'config.stockStart': 'Anfangsbestand',
  'config.stockUnlimited': 'unbegrenzt',
  'settings.title': 'Einstellungen',
  'settings.language': 'Sprache',
  'settings.theme': 'Erscheinungsbild',
  'settings.themeDark': 'Dunkel',
  'settings.themeLight': 'Hell',
  'settings.features': 'Optionale Funktionen',
  'settings.featureTip': 'Trinkgeld-Schnellbutton',
  'settings.featureTipHint':
    'Schnell-Buttons +0,50 € / +1 € / Aufrunden im Bargeld-Bereich.',
  'settings.featureBilanz': 'Tagesbilanz',
  'settings.featureBilanzHint':
    'Jede abgeschlossene Bestellung wird gelistet und kann bearbeitet/gelöscht werden. Mit erwartetem Kassenstand.',
  'settings.featureStock': 'Bestand',
  'settings.featureStockHint':
    'Anfangsbestand pro Getränk hinterlegen — Tile zeigt Restmenge, sperrt bei 0.',
  'settings.cashStart': 'Anfangsbestand Kasse',
  'settings.cashStartHint':
    'Bargeld in der Kasse zu Schichtbeginn — wird in der Tagesbilanz für die Soll-Berechnung genutzt.',
  'bilanz.title': 'Tagesbilanz',
  'bilanz.empty': 'Noch keine Bestellungen abgeschlossen.',
  'bilanz.entries': 'Einträge',
  'bilanz.start': 'Anfangsbestand',
  'bilanz.summary': 'Zusammenfassung',
  'bilanz.gross': 'Brutto-Umsatz',
  'bilanz.tipsTotal': 'Trinkgeld gesamt',
  'bilanz.expectedDrawer': 'Soll in Kasse',
  'bilanz.entryAt': 'Bestellung um',
  'bilanz.editEntry': 'Eintrag bearbeiten',
  'bilanz.deleteEntry': 'Eintrag löschen',
  'bilanz.deleteAll': 'Bilanz leeren',
  'bilanz.deleteAllConfirm': 'Alle Einträge löschen?',
  'bilanz.itemsCount': 'Positionen',
  'bilanz.payment': 'Zahlart',
  'bilanz.paymentCash': 'Bar',
  'bilanz.paymentCard': 'Karte',
  'bilanz.paymentOther': 'Sonstiges',
  'bilanz.byProduct': 'Verkauft pro Produkt',
  'bilanz.unitsSold': 'verkauft',
  'bilanz.export': 'CSV exportieren',
  'bilanz.exportHint': 'Tagesbilanz als CSV-Datei für Excel/Numbers',
  'bilanz.print': 'Drucken',
  'bilanz.printHint': 'Tagesbilanz druckfreundlich anzeigen + drucken',
  'config.bilanzBackupTitle': 'Tagesbilanz sichern',
  'config.bilanzBackupHint':
    'Tagesbilanz als JSON exportieren — kann später wieder importiert werden (z.B. nach Geräte-Wechsel oder Reset). Aktuell:',
  'config.bilanzExport': 'Bilanz exportieren',
  'config.bilanzImport': 'Bilanz importieren',
  'config.bilanzImported': 'Bilanz importiert ✓',
  'config.bilanzImportConfirmTitle': 'Bilanz wirklich ersetzen?',
  'config.bilanzImportConfirmBody':
    '{new} Einträge werden geladen, {old} bestehende Einträge werden ersetzt. Diese Aktion lässt sich nicht rückgängig machen.',
  'config.bilanzImportConfirm': 'Ja, ersetzen',
  'modal.close': 'Schließen',
  'modal.understand': 'Verstanden',
  'common.yes': 'Ja',
  'common.no': 'Nein',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'config.subTabSync': 'Geräte',
  'sync.title': 'Geräte verbinden',
  'sync.idle': 'Noch nicht verbunden',
  'sync.role.master': 'Dieses Gerät ist die Hauptkasse',
  'sync.role.joiner': 'Dieses Gerät ist eine Nebenkasse',
  'sync.startMaster': 'Als Hauptkasse starten',
  'sync.joinAsClient': 'Mit Hauptkasse verbinden',
  'sync.cancelPairing': 'Abbrechen',
  'sync.disconnect': 'Verbindung beenden',
  'sync.peers': 'verbundene Geräte',
  'sync.scanInstruction': 'Dort „Mit Hauptkasse verbinden" tippen. Das Gerät zeigt danach einen Antwort-Code, den du hier scannst.',
  'sync.showOfferQr': 'Schritt 1: Diesen Code am anderen Gerät scannen',
  'sync.showAnswerQr': 'Schritt 2: Diesen Code an der Hauptkasse scannen',
  'sync.scanOffer': 'Code der Hauptkasse scannen',
  'sync.scanAnswer': 'Antwort-Code scannen',
  'sync.connected': 'Verbunden',
  'sync.connectingHint': 'Beide Geräte müssen im selben WLAN oder am Hotspot eines der Geräte sein. Öffentliche WLANs blockieren Verbindungen zwischen Geräten oft.',
  'sync.intro': 'Mehrere Kassen teilen sich Sortiment, Bestand und Tagesbilanz. Direkt zwischen den Geräten, ohne Konto.',
  'sync.privacyHint': 'Die Daten fließen verschlüsselt direkt zwischen den Geräten. Die App nutzt dafür keinen Server und keinen externen Dienst.',
  'sync.statusBadge': 'Sync',
  'sync.errorScan': 'QR-Code konnte nicht gelesen werden:',
  'sync.adoptShared':
    'Das Sortiment des Master-Geräts wird übernommen, Bilanzen werden zusammengeführt.',
  'sync.session': 'Session',
  'sync.notReady': 'Sync wird vorbereitet …',
  'sync.joinerReadOnly': 'Nebenkasse: Sortiment und geteilte Einstellungen kommen von der Hauptkasse. Sprache und Erscheinungsbild bleiben hier wählbar.',
  'sync.peerLabel': 'Gerät',
  'sync.peerSince': 'verbunden seit',
  'sync.kickPeer': 'Trennen',
  'sync.kickConfirm': 'Wirklich?',
  'sync.deviceNameLabel': 'Gerätename',
  'sync.deviceNamePlaceholder': 'z.B. Theke, Hilfsstand …',
  'sync.deviceNameHint':
    'Erscheint in der Tagesbilanz pro Eintrag und wird beim Verbinden anderen Geräten gezeigt.',
  'sync.openGuide': 'Anleitung öffnen',
  'guide.title': 'So verbindest du Geräte',
  'guide.subtitle': 'Direkt per QR-Code, ohne Konto.',
  'guide.prereqTitle': 'Voraussetzungen',
  'guide.prereqWifi': 'Beide Geräte im selben WLAN oder am Hotspot eines der Geräte. Ein Internetzugang ist danach nicht nötig.',
  'guide.prereqCamera': 'Eine Kamera an beiden Geräten. Ohne Kamera lässt sich der Code auch kopieren und einfügen.',
  'guide.prereqBrowser':
    'Aktueller Browser (Chrome, Safari, Firefox, Edge in den letzten 2 Jahren).',
  'guide.s1Title': 'Gerätenamen festlegen',
  'guide.s1Body':
    'Trage oben im Sync-Tab einen sprechenden Namen ein (z.B. „Theke" oder „Hilfsstand"). Dieser Name erscheint später in der Tagesbilanz pro Bestellung und beim Pairing auf den anderen Geräten — so weißt du immer, welcher Eintrag von welchem Gerät kommt.',
  'guide.s2Title': 'Hauptkasse: Verbinden starten',
  'guide.s2Body': 'Tippe auf dem Gerät mit dem richtigen Sortiment auf „Als Hauptkasse starten". Die App zeigt einen QR-Code. Lass ihn sichtbar.',
  'guide.s2Hint': 'Wichtig: Die Hauptkasse gibt Sortiment und Einstellungen für alle vor. Das Sortiment der Nebenkassen wird dabei ersetzt, ihre Verkäufe bleiben erhalten.',
  'guide.s3Title': 'Nebenkasse: Code scannen',
  'guide.s3Body': 'Tippe auf jedem weiteren Gerät auf „Mit Hauptkasse verbinden" und halte die Kamera auf den Code. Danach zeigt dieses Gerät einen Antwort-Code.',
  'guide.s3Hint':
    'Hinweis: Die App fragt beim ersten Scan nach Kamera-Zugriff. Erlauben.',
  'guide.s4Title': 'Hauptkasse: Antwort scannen',
  'guide.s4Body': 'Tippe an der Hauptkasse auf „Antwort-Code scannen" und halte die Kamera auf den Code des anderen Geräts.',
  'guide.s5Title': 'Verbunden!',
  'guide.s5Body': 'Sortiment, Bestand und Tagesbilanz sind jetzt auf allen Geräten gleich.',
  'guide.s5b1':
    'Bestellungen, die du auf einem Gerät abschließt, erscheinen sofort auf den anderen.',
  'guide.s5b2':
    'Bestand wird über alle Geräte hinweg gemeinsam runtergezählt.',
  'guide.s5b3':
    'Du siehst in der Bilanz pro Eintrag, von welchem Gerät die Bestellung kam.',
  'guide.moreDevicesTitle': 'Weitere Geräte hinzufügen',
  'guide.moreDevicesBody': 'Tippe an der Hauptkasse auf „Weitere Kasse verbinden" und wiederhole die Schritte 3 und 4 für jedes Gerät.',
  'guide.troubleTitle': 'Häufige Probleme',
  'guide.troubleQ1': 'Der QR-Code wird nicht erkannt.',
  'guide.troubleA1': 'Display-Helligkeit hochdrehen, 15 bis 25 cm Abstand, Reflexionen vermeiden. Klappt es nicht, den Code kopieren und am anderen Gerät einfügen.',
  'guide.troubleQ2': 'Verbindung bricht ab oder kommt nicht zustande.',
  'guide.troubleA2': 'Beide Geräte müssen im selben Netz sein, über Mobilfunk geht es nicht. Öffentliche WLANs blockieren Verbindungen zwischen Geräten oft. Am zuverlässigsten ist der Hotspot eines der Geräte, auch ohne Internet.',
  'guide.troubleQ3': 'Oben steht „Verbindung verloren".',
  'guide.troubleA3': 'Das passiert, wenn ein Gerät länger gesperrt war oder das Netz wechselte. Es geht nichts verloren: Einfach neu verbinden, Verkäufe werden zusammengeführt. „Bildschirm anlassen" in den Einstellungen beugt vor.',
  'guide.troubleQ4': 'Eine Nebenkasse kann das Sortiment nicht ändern.',
  'guide.troubleA4': 'Das ist Absicht: Die Hauptkasse ist die Quelle der Wahrheit, damit überall dieselben Preise gelten. Änderungen dort erscheinen sofort auf allen Geräten.',
  'guide.privacyTitle': 'Datenschutz',
  'guide.privacyBody': 'Die Geräte sprechen direkt und verschlüsselt im selben Netz miteinander. Die App nutzt dafür keinen Server und keinen externen Dienst.',
  'sync.displaySection': 'Kundendisplay',
  'sync.displaySectionHint':
    'Verbinde ein Tablet als Kundendisplay — zeigt die laufende Bestellung + Gesamtpreis groß und kundenfreundlich an.',
  'sync.pairDisplay': 'Display verbinden',
  'sync.becomeDisplay': 'Als Display nutzen',
  'sync.showDisplayOfferQr': 'Diesen Code am Display scannen',
  'sync.displayScanInstruction': 'Am Display-Gerät „Als Display nutzen" und dann „Kassen-QR scannen" tippen. Den Antwort-Code scannst du anschließend hier.',
  'sync.channelSync': 'Sync',
  'sync.channelDisplay': 'Display',
  'display.title': 'Kundendisplay',
  'display.intro': 'Dieses Gerät zeigt die laufende Bestellung einer Kasse für die Kundschaft. Scanne dafür dort den Code von „Display verbinden".',
  'display.scanCashier': 'Kassen-QR scannen',
  'display.showAnswer': 'Antwort-Code',
  'display.showAnswerHint': 'Tippe an der Kasse auf „Antwort-Code scannen" und scanne diesen Code.',
  'display.cancelPairing': 'Abbrechen',
  'display.connected': 'Verbunden',
  'display.waiting': 'Warte auf Verbindung',
  'display.exit': 'Beenden',
  'display.exitConfirm': 'Wirklich?',
  'display.welcome': 'Willkommen!',
  'display.welcomeHint': 'Was darf es sein?',
  'display.currentOrder': 'Aktuelle Bestellung',
  'display.enterFullscreen': 'Vollbild',
  'display.exitFullscreen': 'Vollbild beenden',
  'sync.reconnectTitle': 'Verbindung verloren',
  'sync.reconnectMasterBody': '{names} ist nicht mehr verbunden,',
  'sync.reconnectJoinerBody': 'Die Hauptkasse „{name}" ist nicht mehr verbunden,',
  'sync.reconnectDisplayBody': 'Display „{name}" ist nicht mehr verbunden,',
  'sync.reconnectMasterQrReady':
    'QR-Code ist sichtbar — Joiner können ihn scannen, um wieder zu verbinden.',
  'sync.reconnectMasterPreparing': 'QR-Code wird gleich angezeigt …',
  'sync.reconnectScanCta': 'Code der Hauptkasse scannen',
  'sync.reconnectDismiss': 'Hinweis verwerfen',
  'sync.reconnectAgo': 'vor',
  'sync.reconnectJustNow': 'gerade eben',
  'display.reconnectTitle': 'Zuletzt verbunden',
  'display.reconnectBody':
    'Dieses Display war zuletzt mit der Kasse „{name}" verbunden. Direkt wieder verbinden?',
  'display.reconnectCta': 'Mit „{name}" verbinden',
  'display.reconnectDismiss': 'Letzte Verbindung vergessen',
  'sync.displaySingular': 'verbunden',
  'sync.displayPlural': 'verbunden',
  'sync.pairAnotherDisplay': 'Weiteres Display verbinden',
  'sync.displayOnlyActive': 'Display-Anbindung aktiv',
  'nav.label': 'Hauptnavigation',
  'nav.order': 'Kasse',
  'nav.bilanz': 'Bilanz',
  'nav.sortiment': 'Sortiment',
  'nav.devices': 'Geräte',
  'nav.settings': 'Optionen',
  'sale.complete': 'Kassieren',
  'sale.done': 'Kassiert: {amount}',
  'sale.discard': 'Leeren',
  'sale.discardOrder': 'Bestellung leeren',
  'sale.discarded': 'Bestellung geleert',
  'sale.undo': 'Rückgängig',
  'sale.itemsOne': '1 Artikel',
  'sale.itemsMany': '{n} Artikel',
  'sale.noItems': 'Nichts gebucht',
  'sale.payout': 'Auszahlen',
  'totalbar.missing': 'Fehlt',
  'drink.a11yInOrder': '{n} in der Bestellung',
  'drink.addMany': 'Mehrere {name} hinzufügen',
  'tip.roundTo': 'Aufrunden auf',
  'tip.custom': 'Eigenes Trinkgeld eingeben',
  'numpad.tipTitle': 'Trinkgeld eingeben',
  'numpad.newTotal': 'Neue Summe',
  'numpad.baseTotal': 'Summe ohne Trinkgeld',
  'numpad.input': 'Eingabe',
  'numpad.comma': 'Komma',
  'numpad.backspace': 'Letzte Ziffer löschen',
  'numpad.apply': 'Übernehmen',
  'settings.themeSystem': 'Automatisch',
  'settings.themeHint': 'Hell liest sich in der Sonne am besten, Dunkel am Abend.',
  'settings.sound': 'Töne',
  'settings.soundHint': 'Kurzer Ton bei jeder Eingabe.',
  'settings.keepAwake': 'Bildschirm anlassen',
  'settings.keepAwakeHint': 'Hält auch die Verbindung zu anderen Geräten stabil. Braucht etwas mehr Akku.',
  'settings.legal': 'Rechtliches',
  'settings.about': 'So werden Daten gespeichert',
  'settings.privacy': 'Datenschutzerklärung',
  'settings.imprint': 'Impressum',
  'settings.version': 'Version',
  'config.deleteConfirm': 'Wirklich?',
  'config.dangerTitle': 'Alles zurücksetzen',
  'config.fileError': 'Die Datei konnte nicht gelesen werden.',
  'bilanz.disabledTitle': 'Tagesbilanz ist aus',
  'bilanz.disabledBody': 'Schalte sie ein, um jeden Verkauf zu erfassen und am Ende den Kassenstand zu prüfen.',
  'bilanz.enable': 'Tagesbilanz einschalten',
  'bilanz.joinerTitle': 'Bilanz liegt auf der Hauptkasse',
  'bilanz.joinerBody': 'Verkäufe dieser Kasse fließen automatisch dort ein.',
  'app.loadError': 'Dieser Bereich konnte nicht geladen werden. Vermutlich gibt es eine neue App-Version oder keine Verbindung.',
  'app.reload': 'Neu laden',
  'scanner.hint': 'QR-Code in den Rahmen halten',
  'scanner.pasteLabel': 'Code einfügen statt scannen',
  'scanner.pasteHint': 'Am anderen Gerät „Code kopieren" tippen, den Code hierher schicken und einfügen.',
  'scanner.pasteSubmit': 'Code übernehmen',
  'scanner.errDenied': 'Kamera-Zugriff ist nicht erlaubt. Erlaube ihn in den Browser-Einstellungen oder füge den Code unten ein.',
  'scanner.errNoCamera': 'Keine Kamera gefunden. Füge den Code unten ein.',
  'scanner.errGeneric': 'Die Kamera lässt sich gerade nicht starten. Füge den Code unten ein.',
  'sync.startMasterHint': 'Dieses Gerät gibt Sortiment und Einstellungen für alle vor.',
  'sync.joinHint': 'Dieses Gerät übernimmt Sortiment und Einstellungen der Hauptkasse. Verkäufe bleiben erhalten.',
  'sync.addDevice': 'Weitere Kasse verbinden',
  'sync.answerInstruction': 'Dort „Antwort-Code scannen" tippen. Danach sind die Geräte verbunden.',
  'sync.copyCode': 'Code kopieren',
  'sync.codeCopied': 'Code kopiert',
  'sync.preparing': 'Code wird erstellt …',
  'sync.connecting': 'Verbindung wird aufgebaut …',
  'sync.connectingBody': 'Dauert meist nur wenige Sekunden.',
  'sync.peerSynced': 'Daten abgeglichen um {time}',
  'sync.peerUnstable': 'Verbindung instabil, warte auf das Gerät …',
  'sync.peerVersion': 'Andere App-Version ({version}). Beide Geräte neu laden, wenn Netz da ist.',
  'sync.chipConnected': '{n} verbunden',
  'sync.chipError': 'Kopplung fehlgeschlagen',
  'sync.chipPairing': 'Verbinden …',
  'sync.chipUnstable': 'Verbindung instabil',
  'sync.bannerTitle': 'Keine Verbindung zu {names}',
  'sync.bannerBody': 'Verkäufe bleiben hier gespeichert.',
  'sync.bannerAction': 'Neu verbinden',
  'sync.sinceMinutes': 'seit {n} Min.',
  'sync.sinceHours': 'seit {n} Std.',
  'sync.reconnectSafe': 'Es geht nichts verloren: Verkäufe werden beim Verbinden zusammengeführt. Dafür einmal neu koppeln.',
  'sync.reconnectShowCta': 'Code zum Verbinden zeigen',
  'sync.diagnostics': 'Diagnose für den Support kopieren',
  'sync.diagnosticsCopied': 'Diagnose kopiert, ohne Umsatzdaten',
  'sync.err.qr-invalid': 'Das ist kein Code dieser App. Halte die Kamera auf den Code im Geräte-Tab des anderen Geräts.',
  'sync.err.qr-outdated': 'Das andere Gerät nutzt eine ältere App-Version. Lade dort die App einmal mit Internet neu.',
  'sync.err.qr-newer': 'Das andere Gerät nutzt eine neuere App-Version. Lade hier die App einmal mit Internet neu.',
  'sync.err.qr-expected-offer': 'Das ist ein Antwort-Code. Scanne hier den Code der Hauptkasse.',
  'sync.err.qr-expected-answer': 'Scanne hier den Antwort-Code, den das andere Gerät gerade zeigt.',
  'sync.err.qr-wrong-mode': 'Das ist ein Code für den anderen Modus. Displays brauchen an der Kasse „Display verbinden", Kassen „Als Hauptkasse starten".',
  'sync.err.session-mismatch': 'Dieser Antwort-Code gehört zu einem älteren Versuch. Starte das Koppeln auf beiden Geräten neu.',
  'sync.err.no-pairing': 'Es läuft gerade keine Kopplung. Starte sie zuerst an der Hauptkasse.',
  'sync.err.role-conflict': 'Beende zuerst die bestehende Verbindung dieses Geräts.',
  'sync.err.webrtc-unavailable': 'Dieser Browser erlaubt keine direkten Verbindungen. Nutze einen aktuellen Browser und schalte den iOS-Blockierungsmodus aus.',
  'sync.err.no-candidates': 'Kein Netzwerk gefunden. Verbinde das Gerät mit einem WLAN oder Hotspot und versuche es noch einmal.',
  'sync.err.connect-timeout': 'Die Geräte erreichen sich nicht. Bringe beide ins selbe WLAN oder nutze den Hotspot eines Geräts und starte das Koppeln neu.',
  'sync.err.connect-failed': 'Die Verbindung kam nicht zustande. Bringe beide Geräte ins selbe WLAN oder nutze den Hotspot eines Geräts und starte das Koppeln neu.',
  'sync.err.unknown': 'Das hat nicht geklappt. Bitte versuche es noch einmal.',
};

export const en: Translations = {
  'tabs.order': 'Order',
  'tabs.config': 'Configuration',
  'header.newOrder': 'New order',
  'header.resetAll': 'Reset everything',
  'header.resetAllConfirm': 'Really delete everything?',
  'header.storno': 'Cancel',
  'header.stornoActive': 'Cancel mode active',
  'header.soundOn': 'Sound on',
  'header.soundOff': 'Sound off',
  'header.privacy': 'Privacy info',
  'header.bilanz': 'Day balance',
  'banner.stornoMode': 'Cancel mode: tap removes 1 item',
  'order.title': 'Order',
  'order.empty': 'No order yet',
  'order.emptyHint': 'Tap a drink.',
  'order.tap': 'Tap to open',
  'order.unitLabel': '/ ea',
  'order.removePosition': 'Remove line',
  'order.minusOne': 'One less',
  'order.plusOne': 'One more',
  'pfand.return': 'Deposit return',
  'pfand.unitLabel': '/ ea',
  'totalbar.drinks': 'Drinks',
  'totalbar.pfand': '+ Deposit',
  'totalbar.return': '− Return',
  'totalbar.cash': 'Cash',
  'totalbar.tip': '+ Tip',
  'totalbar.total': 'To pay',
  'totalbar.given': 'Given',
  'totalbar.change': 'Change',
  'totalbar.exact': 'Exact',
  'cash.given': 'Given',
  'cash.cancel': 'Cancel',
  'cash.confirm': 'OK',
  'cash.customAmount': 'Enter custom amount',
  'cash.title': 'Cash from customer',
  'tip.label': 'Tip',
  'tip.plus50': '+0.50 €',
  'tip.plus1': '+1 €',
  'tip.roundUp5': 'To 5 €',
  'tip.roundUp10': 'To 10 €',
  'tip.clear': 'Clear tip',
  'drink.noPfand': 'no deposit',
  'drink.outOfStock': 'empty',
  'drink.stockLeft': 'left',
  'config.toolbar.hint':
    'All settings are saved locally on this device (localStorage + IndexedDB) and survive reload — no cloud server.',
  'config.export': 'Export products',
  'config.import': 'Import products',
  'config.imported': 'Products imported ✓',
  'config.sortimentBackupTitle': 'Back up products',
  'config.sortimentBackupHint':
    'Save product and deposit list as JSON or load from another device.',
  'config.pfandCategories': 'Deposit categories',
  'config.drinks': 'Products',
  'config.newPfand': 'New deposit category',
  'config.newDrink': 'New product',
  'config.subTabSortiment': 'Products',
  'config.subTabSettings': 'Settings',
  'config.subTabData': 'Data',
  'config.dataDanger':
    'Warning: "Reset everything" deletes products, settings and the day balance permanently.',
  'config.add': 'Add',
  'config.label': 'Label',
  'config.amount': 'Amount',
  'config.size': 'Size',
  'config.price': 'Price',
  'config.icon': 'Icon',
  'config.pfandType': 'Deposit type',
  'config.noPfand': 'No deposit',
  'config.happyHour': 'Happy Hour',
  'config.startTime': 'Start',
  'config.endTime': 'End',
  'config.priceEur': 'Price €',
  'config.save': 'Save',
  'config.discard': 'Discard',
  'config.delete': 'Delete',
  'config.noDrinks': 'No drinks defined yet.',
  'config.noPfandTypes': 'No deposit categories defined yet.',
  'config.stockTitle': 'Stock',
  'config.stockHint': 'Available units — leave empty for unlimited.',
  'config.stockStart': 'Initial stock',
  'config.stockUnlimited': 'unlimited',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Appearance',
  'settings.themeDark': 'Dark',
  'settings.themeLight': 'Light',
  'settings.features': 'Optional features',
  'settings.featureTip': 'Tip quick buttons',
  'settings.featureTipHint':
    'Quick buttons +0.50 € / +1 € / round up in the cash area.',
  'settings.featureBilanz': 'Day balance',
  'settings.featureBilanzHint':
    'Each completed order is logged and can be edited/deleted. Includes expected cash drawer total.',
  'settings.featureStock': 'Stock',
  'settings.featureStockHint':
    'Set initial stock per drink — tile shows remaining, locks at 0.',
  'settings.cashStart': 'Initial cash drawer',
  'settings.cashStartHint':
    'Cash in the drawer at shift start — used in the day balance to calculate expected total.',
  'bilanz.title': 'Day balance',
  'bilanz.empty': 'No completed orders yet.',
  'bilanz.entries': 'Entries',
  'bilanz.start': 'Start cash',
  'bilanz.summary': 'Summary',
  'bilanz.gross': 'Gross revenue',
  'bilanz.tipsTotal': 'Tips total',
  'bilanz.expectedDrawer': 'Expected in drawer',
  'bilanz.entryAt': 'Order at',
  'bilanz.editEntry': 'Edit entry',
  'bilanz.deleteEntry': 'Delete entry',
  'bilanz.deleteAll': 'Clear balance',
  'bilanz.deleteAllConfirm': 'Delete all entries?',
  'bilanz.itemsCount': 'Items',
  'bilanz.payment': 'Payment',
  'bilanz.paymentCash': 'Cash',
  'bilanz.paymentCard': 'Card',
  'bilanz.paymentOther': 'Other',
  'bilanz.byProduct': 'Sold per product',
  'bilanz.unitsSold': 'sold',
  'bilanz.export': 'Export CSV',
  'bilanz.exportHint': 'Download balance as CSV file for Excel/Numbers',
  'bilanz.print': 'Print',
  'bilanz.printHint': 'Show day balance in a print-friendly view',
  'config.bilanzBackupTitle': 'Back up day balance',
  'config.bilanzBackupHint':
    'Export day balance as JSON — can be imported again later (e.g. after device change or reset). Current:',
  'config.bilanzExport': 'Export balance',
  'config.bilanzImport': 'Import balance',
  'config.bilanzImported': 'Balance imported ✓',
  'config.bilanzImportConfirmTitle': 'Really replace the balance?',
  'config.bilanzImportConfirmBody':
    '{new} entries will be loaded, {old} existing entries will be replaced. This cannot be undone.',
  'config.bilanzImportConfirm': 'Yes, replace',
  'modal.close': 'Close',
  'modal.understand': 'Got it',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'config.subTabSync': 'Devices',
  'sync.title': 'Connect devices',
  'sync.idle': 'Not connected yet',
  'sync.role.master': 'This device is the main till',
  'sync.role.joiner': 'This device is a second till',
  'sync.startMaster': 'Start as main till',
  'sync.joinAsClient': 'Connect to main till',
  'sync.cancelPairing': 'Cancel',
  'sync.disconnect': 'End connection',
  'sync.peers': 'connected devices',
  'sync.scanInstruction': 'Tap “Connect to main till” there. It then shows an answer code for you to scan here.',
  'sync.showOfferQr': 'Step 1: Scan this code on the other device',
  'sync.showAnswerQr': 'Step 2: Scan this code on the main till',
  'sync.scanOffer': 'Scan the main till’s code',
  'sync.scanAnswer': 'Scan answer code',
  'sync.connected': 'Connected',
  'sync.connectingHint': 'Both devices must be on the same Wi-Fi or on one device’s hotspot. Public Wi-Fi often blocks connections between devices.',
  'sync.intro': 'Several tills share products, stock and day balance. Directly between devices, no account needed.',
  'sync.privacyHint': 'Data travels encrypted, directly between devices. The app uses no server and no external service for this.',
  'sync.statusBadge': 'Sync',
  'sync.errorScan': 'QR code could not be read:',
  'sync.adoptShared':
    'The master device product list is adopted; balances are merged.',
  'sync.session': 'Session',
  'sync.notReady': 'Sync is initializing …',
  'sync.joinerReadOnly': 'Second till: products and shared settings come from the main till. Language and appearance stay local.',
  'sync.peerLabel': 'Device',
  'sync.peerSince': 'connected since',
  'sync.kickPeer': 'Disconnect',
  'sync.kickConfirm': 'Sure?',
  'sync.deviceNameLabel': 'Device name',
  'sync.deviceNamePlaceholder': 'e.g. Counter, Helper desk …',
  'sync.deviceNameHint':
    'Shown per entry in the day balance and to other devices on pairing.',
  'sync.openGuide': 'Open guide',
  'guide.title': 'How to connect devices',
  'guide.subtitle': 'Directly by QR code, no account needed.',
  'guide.prereqTitle': 'Prerequisites',
  'guide.prereqWifi': 'Both devices on the same Wi-Fi or on one device’s hotspot. No internet needed afterwards.',
  'guide.prereqCamera': 'A camera on both devices. Without one, the code can also be copied and pasted.',
  'guide.prereqBrowser':
    'Modern browser (Chrome, Safari, Firefox, Edge from the past 2 years).',
  'guide.s1Title': 'Set device name',
  'guide.s1Body':
    'On each device, set a meaningful name in the Sync tab (e.g. "Counter" or "Helper desk"). This name will appear per order in the day balance and during pairing on the other devices — so you always know which entry came from which device.',
  'guide.s2Title': 'Main till: start connecting',
  'guide.s2Body': 'On the device with the correct products, tap “Start as main till”. The app shows a QR code. Keep it visible.',
  'guide.s2Hint': 'Important: the main till sets products and settings for everyone. The second tills’ products are replaced, their sales are kept.',
  'guide.s3Title': 'Second till: scan the code',
  'guide.s3Body': 'On each further device, tap “Connect to main till” and point the camera at the code. That device then shows an answer code.',
  'guide.s3Hint':
    'Note: The app will ask for camera permission on first scan. Allow it.',
  'guide.s4Title': 'Main till: scan the answer',
  'guide.s4Body': 'On the main till, tap “Scan answer code” and point the camera at the other device’s code.',
  'guide.s5Title': 'Connected!',
  'guide.s5Body': 'Products, stock and day balance now match on all devices.',
  'guide.s5b1':
    'Orders you complete on one device appear instantly on the others.',
  'guide.s5b2': 'Stock counts down across all devices together.',
  'guide.s5b3':
    'Each balance entry shows which device created the order.',
  'guide.moreDevicesTitle': 'Adding more devices',
  'guide.moreDevicesBody': 'On the main till, tap “Connect another till” and repeat steps 3 and 4 for each device.',
  'guide.troubleTitle': 'Common problems',
  'guide.troubleQ1': 'The QR code is not detected.',
  'guide.troubleA1': 'Turn up screen brightness, keep 15 to 25 cm distance, avoid reflections. If it still fails, copy the code and paste it on the other device.',
  'guide.troubleQ2': 'Connection drops or never establishes.',
  'guide.troubleA2': 'Both devices must be on the same network; mobile data doesn’t work. Public Wi-Fi often blocks connections between devices. A hotspot from one of the devices is most reliable, even without internet.',
  'guide.troubleQ3': 'It says “Connection lost”.',
  'guide.troubleA3': 'This happens when a device was locked for a while or changed networks. Nothing is lost: reconnect and sales are merged. “Keep screen on” in Settings helps prevent it.',
  'guide.troubleQ4': 'A second till can’t change the products.',
  'guide.troubleA4': 'That’s intentional: the main till is the source of truth so prices match everywhere. Changes there appear on all devices at once.',
  'guide.privacyTitle': 'Privacy',
  'guide.privacyBody': 'Devices talk directly and encrypted on the same network. The app uses no server and no external service for this.',
  'sync.displaySection': 'Customer display',
  'sync.displaySectionHint':
    'Connect a tablet as a customer display — shows the current order + total in large, customer-friendly type.',
  'sync.pairDisplay': 'Connect display',
  'sync.becomeDisplay': 'Use as display',
  'sync.showDisplayOfferQr': 'Scan this code on the display',
  'sync.displayScanInstruction': 'On the display device, tap “Use as display”, then “Scan till QR”. Then scan its answer code here.',
  'sync.channelSync': 'Sync',
  'sync.channelDisplay': 'Display',
  'display.title': 'Customer display',
  'display.intro': 'This device shows a till’s current order to customers. Scan the code from “Connect display” on the till.',
  'display.scanCashier': 'Scan cashier QR',
  'display.showAnswer': 'Response code',
  'display.showAnswerHint': 'Tap “Scan answer code” on the till and scan this code.',
  'display.cancelPairing': 'Cancel',
  'display.connected': 'Connected',
  'display.waiting': 'Waiting for connection',
  'display.exit': 'Exit',
  'display.exitConfirm': 'Really?',
  'display.welcome': 'Welcome!',
  'display.welcomeHint': "What'll it be?",
  'display.currentOrder': 'Current order',
  'display.enterFullscreen': 'Fullscreen',
  'display.exitFullscreen': 'Exit fullscreen',
  'sync.reconnectTitle': 'Connection lost',
  'sync.reconnectMasterBody': '{names} is no longer connected,',
  'sync.reconnectJoinerBody': 'The main till “{name}” is no longer connected,',
  'sync.reconnectDisplayBody': 'Display “{name}” is no longer connected,',
  'sync.reconnectMasterQrReady':
    'QR is visible — joiners can scan it to reconnect.',
  'sync.reconnectMasterPreparing': 'QR will appear shortly …',
  'sync.reconnectScanCta': 'Scan the main till’s code',
  'sync.reconnectDismiss': 'Dismiss',
  'sync.reconnectAgo': 'ago',
  'sync.reconnectJustNow': 'just now',
  'display.reconnectTitle': 'Last connection',
  'display.reconnectBody':
    'This display was last connected to cashier "{name}". Reconnect now?',
  'display.reconnectCta': 'Connect to "{name}"',
  'display.reconnectDismiss': 'Forget last connection',
  'sync.displaySingular': 'connected',
  'sync.displayPlural': 'connected',
  'sync.pairAnotherDisplay': 'Connect another display',
  'sync.displayOnlyActive': 'Display connection active',
  'nav.label': 'Main navigation',
  'nav.order': 'Till',
  'nav.bilanz': 'Balance',
  'nav.sortiment': 'Products',
  'nav.devices': 'Devices',
  'nav.settings': 'Settings',
  'sale.complete': 'Charge',
  'sale.done': 'Charged: {amount}',
  'sale.discard': 'Clear',
  'sale.discardOrder': 'Clear order',
  'sale.discarded': 'Order cleared',
  'sale.undo': 'Undo',
  'sale.itemsOne': '1 item',
  'sale.itemsMany': '{n} items',
  'sale.noItems': 'Nothing added',
  'sale.payout': 'Pay out',
  'totalbar.missing': 'Missing',
  'drink.a11yInOrder': '{n} in order',
  'drink.addMany': 'Add several {name}',
  'tip.roundTo': 'Round up to',
  'tip.custom': 'Enter custom tip',
  'numpad.tipTitle': 'Enter tip',
  'numpad.newTotal': 'New total',
  'numpad.baseTotal': 'Total without tip',
  'numpad.input': 'Entered',
  'numpad.comma': 'Decimal point',
  'numpad.backspace': 'Delete last digit',
  'numpad.apply': 'Apply',
  'settings.themeSystem': 'Automatic',
  'settings.themeHint': 'Light reads best in sunlight, dark in the evening.',
  'settings.sound': 'Sounds',
  'settings.soundHint': 'A short sound with every input.',
  'settings.keepAwake': 'Keep screen on',
  'settings.keepAwakeHint': 'Also keeps the connection to other devices stable. Uses a little more battery.',
  'settings.legal': 'Legal',
  'settings.about': 'How data is stored',
  'settings.privacy': 'Privacy policy',
  'settings.imprint': 'Legal notice',
  'settings.version': 'Version',
  'config.deleteConfirm': 'Sure?',
  'config.dangerTitle': 'Reset everything',
  'config.fileError': 'The file could not be read.',
  'bilanz.disabledTitle': 'Day balance is off',
  'bilanz.disabledBody': 'Turn it on to record every sale and check the cash drawer at the end.',
  'bilanz.enable': 'Turn on day balance',
  'bilanz.joinerTitle': 'The balance is on the main till',
  'bilanz.joinerBody': 'Sales from this till are added there automatically.',
  'app.loadError': 'This section could not be loaded. There may be a new app version or no connection.',
  'app.reload': 'Reload',
  'scanner.hint': 'Hold the QR code inside the frame',
  'scanner.pasteLabel': 'Paste code instead of scanning',
  'scanner.pasteHint': 'Tap “Copy code” on the other device, send the code here and paste it.',
  'scanner.pasteSubmit': 'Use code',
  'scanner.errDenied': 'Camera access is blocked. Allow it in your browser settings or paste the code below.',
  'scanner.errNoCamera': 'No camera found. Paste the code below.',
  'scanner.errGeneric': 'The camera can’t start right now. Paste the code below.',
  'sync.startMasterHint': 'This device sets products and settings for everyone.',
  'sync.joinHint': 'This device adopts the main till’s products and settings. Sales are kept.',
  'sync.addDevice': 'Connect another till',
  'sync.answerInstruction': 'Tap “Scan answer code” there. The devices are then connected.',
  'sync.copyCode': 'Copy code',
  'sync.codeCopied': 'Code copied',
  'sync.preparing': 'Creating code …',
  'sync.connecting': 'Connecting …',
  'sync.connectingBody': 'Usually takes just a few seconds.',
  'sync.peerSynced': 'Data synced at {time}',
  'sync.peerUnstable': 'Unstable connection, waiting for the device …',
  'sync.peerVersion': 'Different app version ({version}). Reload both devices when online.',
  'sync.chipConnected': '{n} connected',
  'sync.chipError': 'Pairing failed',
  'sync.chipPairing': 'Connecting …',
  'sync.chipUnstable': 'Unstable connection',
  'sync.bannerTitle': 'No connection to {names}',
  'sync.bannerBody': 'Sales stay saved here.',
  'sync.bannerAction': 'Reconnect',
  'sync.sinceMinutes': 'for {n} min',
  'sync.sinceHours': 'for {n} h',
  'sync.reconnectSafe': 'Nothing is lost: sales are merged when you reconnect. Just pair once more.',
  'sync.reconnectShowCta': 'Show connection code',
  'sync.diagnostics': 'Copy diagnostics for support',
  'sync.diagnosticsCopied': 'Diagnostics copied, no sales data',
  'sync.err.qr-invalid': 'This isn’t a code from this app. Point the camera at the code in the other device’s Devices tab.',
  'sync.err.qr-outdated': 'The other device runs an older app version. Reload the app there once while online.',
  'sync.err.qr-newer': 'The other device runs a newer app version. Reload the app here once while online.',
  'sync.err.qr-expected-offer': 'That’s an answer code. Scan the main till’s code here.',
  'sync.err.qr-expected-answer': 'Scan the answer code the other device is showing.',
  'sync.err.qr-wrong-mode': 'This code is for the other mode. Displays need “Connect display” on the till, tills need “Start as main till”.',
  'sync.err.session-mismatch': 'This answer code belongs to an earlier attempt. Restart pairing on both devices.',
  'sync.err.no-pairing': 'No pairing is in progress. Start it on the main till first.',
  'sync.err.role-conflict': 'End this device’s current connection first.',
  'sync.err.webrtc-unavailable': 'This browser doesn’t allow direct connections. Use a current browser and turn off iOS Lockdown Mode.',
  'sync.err.no-candidates': 'No network found. Connect the device to Wi-Fi or a hotspot and try again.',
  'sync.err.connect-timeout': 'The devices can’t reach each other. Put both on the same Wi-Fi or use one device’s hotspot, then pair again.',
  'sync.err.connect-failed': 'The connection failed. Put both devices on the same Wi-Fi or use one device’s hotspot, then pair again.',
  'sync.err.unknown': 'That didn’t work. Please try again.',
};

export const fr: Translations = {
  'tabs.order': 'Commande',
  'tabs.config': 'Configuration',
  'header.newOrder': 'Nouvelle commande',
  'header.resetAll': 'Tout réinitialiser',
  'header.resetAllConfirm': 'Vraiment tout supprimer ?',
  'header.storno': 'Annuler',
  'header.stornoActive': 'Mode annulation',
  'header.soundOn': 'Son activé',
  'header.soundOff': 'Son désactivé',
  'header.privacy': 'Confidentialité',
  'header.bilanz': 'Bilan du jour',
  'banner.stornoMode': "Mode annulation : tapoter retire 1 article",
  'order.title': 'Commande',
  'order.empty': 'Aucune commande',
  'order.emptyHint': 'Touchez une boisson.',
  'order.tap': 'Tapez pour ouvrir',
  'order.unitLabel': '/ unité',
  'order.removePosition': 'Retirer la ligne',
  'order.minusOne': 'Un de moins',
  'order.plusOne': 'Un de plus',
  'pfand.return': 'Retour consigne',
  'pfand.unitLabel': '/ unité',
  'totalbar.drinks': 'Boissons',
  'totalbar.pfand': '+ Consigne',
  'totalbar.return': '− Retour',
  'totalbar.cash': 'Espèces',
  'totalbar.tip': '+ Pourboire',
  'totalbar.total': 'À payer',
  'totalbar.given': 'Donné',
  'totalbar.change': 'Rendu',
  'totalbar.exact': 'Compte juste',
  'cash.given': 'Donné',
  'cash.cancel': 'Annuler',
  'cash.confirm': 'OK',
  'cash.customAmount': 'Saisir un montant',
  'cash.title': 'Espèces du client',
  'tip.label': 'Pourboire',
  'tip.plus50': '+0,50 €',
  'tip.plus1': '+1 €',
  'tip.roundUp5': 'À 5 €',
  'tip.roundUp10': 'À 10 €',
  'tip.clear': 'Retirer pourboire',
  'drink.noPfand': 'sans consigne',
  'drink.outOfStock': 'épuisé',
  'drink.stockLeft': 'restant',
  'config.toolbar.hint':
    "Tous les réglages sont sauvegardés localement sur cet appareil (localStorage + IndexedDB) et persistent après rechargement — aucun serveur cloud.",
  'config.export': 'Exporter les produits',
  'config.import': 'Importer les produits',
  'config.imported': 'Produits importés ✓',
  'config.sortimentBackupTitle': 'Sauvegarder les produits',
  'config.sortimentBackupHint':
    "Sauvegarder la liste produits/consigne en JSON ou la charger depuis un autre appareil.",
  'config.pfandCategories': 'Catégories de consigne',
  'config.drinks': 'Produits',
  'config.newPfand': 'Nouvelle consigne',
  'config.newDrink': 'Nouveau produit',
  'config.subTabSortiment': 'Produits',
  'config.subTabSettings': 'Réglages',
  'config.subTabData': 'Données',
  'config.dataDanger':
    'Attention : « Tout réinitialiser » supprime définitivement les produits, réglages et le bilan.',
  'config.add': 'Ajouter',
  'config.label': 'Désignation',
  'config.amount': 'Montant',
  'config.size': 'Taille',
  'config.price': 'Prix',
  'config.icon': 'Icône',
  'config.pfandType': 'Type de consigne',
  'config.noPfand': 'Sans consigne',
  'config.happyHour': 'Happy Hour',
  'config.startTime': 'Début',
  'config.endTime': 'Fin',
  'config.priceEur': 'Prix €',
  'config.save': 'Enregistrer',
  'config.discard': 'Annuler',
  'config.delete': 'Supprimer',
  'config.noDrinks': 'Aucune boisson définie.',
  'config.noPfandTypes': 'Aucune catégorie de consigne.',
  'config.stockTitle': 'Stock',
  'config.stockHint': 'Quantité disponible — vide pour illimité.',
  'config.stockStart': 'Stock initial',
  'config.stockUnlimited': 'illimité',
  'settings.title': 'Paramètres',
  'settings.language': 'Langue',
  'settings.theme': 'Apparence',
  'settings.themeDark': 'Sombre',
  'settings.themeLight': 'Clair',
  'settings.features': 'Fonctions optionnelles',
  'settings.featureTip': 'Boutons pourboire',
  'settings.featureTipHint':
    'Boutons rapides +0,50 € / +1 € / arrondir dans la zone espèces.',
  'settings.featureBilanz': 'Bilan du jour',
  'settings.featureBilanzHint':
    'Chaque commande est enregistrée et modifiable. Calcul du fond de caisse attendu.',
  'settings.featureStock': 'Stock',
  'settings.featureStockHint':
    'Stock initial par boisson — la tuile affiche le restant, bloque à 0.',
  'settings.cashStart': 'Fond de caisse initial',
  'settings.cashStartHint':
    "Espèces en caisse au début du service — utilisé dans le bilan pour le calcul du total attendu.",
  'bilanz.title': 'Bilan du jour',
  'bilanz.empty': 'Aucune commande clôturée.',
  'bilanz.entries': 'Entrées',
  'bilanz.start': 'Fond initial',
  'bilanz.summary': 'Résumé',
  'bilanz.gross': 'Chiffre brut',
  'bilanz.tipsTotal': 'Pourboires',
  'bilanz.expectedDrawer': 'Attendu en caisse',
  'bilanz.entryAt': 'Commande à',
  'bilanz.editEntry': 'Modifier',
  'bilanz.deleteEntry': 'Supprimer',
  'bilanz.deleteAll': 'Vider le bilan',
  'bilanz.deleteAllConfirm': 'Supprimer toutes les entrées ?',
  'bilanz.itemsCount': 'Articles',
  'bilanz.payment': 'Paiement',
  'bilanz.paymentCash': 'Espèces',
  'bilanz.paymentCard': 'Carte',
  'bilanz.paymentOther': 'Autre',
  'bilanz.byProduct': 'Vendu par produit',
  'bilanz.unitsSold': 'vendus',
  'bilanz.export': 'Exporter CSV',
  'bilanz.exportHint': 'Télécharger le bilan en CSV pour Excel/Numbers',
  'bilanz.print': 'Imprimer',
  'bilanz.printHint': 'Afficher le bilan dans une vue imprimable',
  'config.bilanzBackupTitle': 'Sauvegarder le bilan',
  'config.bilanzBackupHint':
    "Exporter le bilan en JSON — réimportable plus tard (changement d appareil, reset). Actuel :",
  'config.bilanzExport': 'Exporter le bilan',
  'config.bilanzImport': 'Importer le bilan',
  'config.bilanzImported': 'Bilan importé ✓',
  'config.bilanzImportConfirmTitle': 'Vraiment remplacer le bilan ?',
  'config.bilanzImportConfirmBody':
    "{new} entrées seront chargées, {old} entrées existantes remplacées. Action irréversible.",
  'config.bilanzImportConfirm': 'Oui, remplacer',
  'modal.close': 'Fermer',
  'modal.understand': "J'ai compris",
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'config.subTabSync': 'Appareils',
  'sync.title': 'Connecter des appareils',
  'sync.idle': 'Pas encore connecté',
  'sync.role.master': 'Cet appareil est la caisse principale',
  'sync.role.joiner': 'Cet appareil est une caisse secondaire',
  'sync.startMaster': 'Démarrer comme caisse principale',
  'sync.joinAsClient': 'Connecter à la caisse principale',
  'sync.cancelPairing': 'Annuler',
  'sync.disconnect': 'Mettre fin à la connexion',
  'sync.peers': 'appareils connectés',
  'sync.scanInstruction': 'Touchez « Connecter à la caisse principale ». L’appareil affiche alors un code réponse à scanner ici.',
  'sync.showOfferQr': 'Étape 1 : scannez ce code sur l’autre appareil',
  'sync.showAnswerQr': 'Étape 2 : scannez ce code sur la caisse principale',
  'sync.scanOffer': 'Scanner le code de la caisse principale',
  'sync.scanAnswer': 'Scanner le code réponse',
  'sync.connected': 'Connecté',
  'sync.connectingHint': 'Les deux appareils doivent être sur le même Wi-Fi ou le partage de connexion de l’un d’eux. Les Wi-Fi publics bloquent souvent les connexions entre appareils.',
  'sync.intro': 'Plusieurs caisses partagent produits, stock et bilan. Directement entre appareils, sans compte.',
  'sync.privacyHint': 'Les données circulent chiffrées, directement entre appareils. L’app n’utilise aucun serveur ni service externe.',
  'sync.statusBadge': 'Synchro',
  'sync.errorScan': 'Le QR code n a pas pu être lu :',
  'sync.adoptShared':
    "La liste produits du maître est adoptée ; les bilans sont fusionnés.",
  'sync.session': 'Session',
  'sync.notReady': 'Préparation de la synchro …',
  'sync.joinerReadOnly': 'Caisse secondaire : produits et réglages partagés viennent de la caisse principale. Langue et apparence restent locales.',
  'sync.peerLabel': 'Appareil',
  'sync.peerSince': 'connecté depuis',
  'sync.kickPeer': 'Déconnecter',
  'sync.kickConfirm': 'Sûr ?',
  'sync.deviceNameLabel': "Nom de l'appareil",
  'sync.deviceNamePlaceholder': 'ex. Comptoir, Aide …',
  'sync.deviceNameHint':
    'Affiché par entrée dans le bilan du jour et lors du pairage.',
  'sync.openGuide': 'Ouvrir le guide',
  'guide.title': 'Comment connecter des appareils',
  'guide.subtitle': 'Directement par code QR, sans compte.',
  'guide.prereqTitle': 'Prérequis',
  'guide.prereqWifi': 'Les deux appareils sur le même Wi-Fi ou le partage de connexion de l’un d’eux. Internet n’est plus nécessaire ensuite.',
  'guide.prereqCamera': 'Une caméra sur les deux appareils. Sinon, le code peut être copié et collé.',
  'guide.prereqBrowser':
    'Navigateur récent (Chrome, Safari, Firefox, Edge des 2 dernières années).',
  'guide.s1Title': "Définir le nom de l'appareil",
  'guide.s1Body':
    "Sur chaque appareil, saisissez un nom dans l onglet Sync (ex. « Comptoir » ou « Aide »). Ce nom apparaîtra par commande dans le bilan et lors du pairage.",
  'guide.s2Title': 'Caisse principale : lancer la connexion',
  'guide.s2Body': 'Sur l’appareil ayant les bons produits, touchez « Démarrer comme caisse principale ». L’app affiche un code QR. Laissez-le visible.',
  'guide.s2Hint': 'Important : la caisse principale définit produits et réglages pour tous. Les produits des caisses secondaires sont remplacés, leurs ventes conservées.',
  'guide.s3Title': 'Caisse secondaire : scanner le code',
  'guide.s3Body': 'Sur chaque autre appareil, touchez « Connecter à la caisse principale » et visez le code. L’appareil affiche alors un code réponse.',
  'guide.s3Hint':
    "Note : l app demandera l accès caméra au premier scan. Autorisez.",
  'guide.s4Title': 'Caisse principale : scanner la réponse',
  'guide.s4Body': 'Sur la caisse principale, touchez « Scanner le code réponse » et visez le code de l’autre appareil.',
  'guide.s5Title': 'Connecté !',
  'guide.s5Body': 'Produits, stock et bilan sont désormais identiques sur tous les appareils.',
  'guide.s5b1':
    'Les commandes terminées sur un appareil apparaissent instantanément sur les autres.',
  'guide.s5b2': 'Le stock diminue conjointement sur tous les appareils.',
  'guide.s5b3':
    "Chaque entrée du bilan indique l appareil qui a créé la commande.",
  'guide.moreDevicesTitle': 'Ajouter plus d appareils',
  'guide.moreDevicesBody': 'Sur la caisse principale, touchez « Connecter une autre caisse » et répétez les étapes 3 et 4 pour chaque appareil.',
  'guide.troubleTitle': 'Problèmes fréquents',
  'guide.troubleQ1': "Le QR n est pas détecté.",
  'guide.troubleA1': 'Augmentez la luminosité, gardez 15 à 25 cm, évitez les reflets. Sinon, copiez le code et collez-le sur l’autre appareil.',
  'guide.troubleQ2': "Connexion qui s interrompt ou ne s établit pas.",
  'guide.troubleA2': 'Les deux appareils doivent être sur le même réseau ; les données mobiles ne fonctionnent pas. Les Wi-Fi publics bloquent souvent ces connexions. Le partage de connexion d’un appareil est le plus fiable, même sans Internet.',
  'guide.troubleQ3': 'Il est indiqué « Connexion perdue ».',
  'guide.troubleA3': 'Cela arrive quand un appareil est resté verrouillé ou a changé de réseau. Rien n’est perdu : reconnectez, les ventes sont fusionnées. « Garder l’écran allumé » dans les réglages l’évite.',
  'guide.troubleQ4': 'Une caisse secondaire ne peut pas modifier les produits.',
  'guide.troubleA4': 'C’est voulu : la caisse principale fait référence pour que les prix soient partout identiques. Ses modifications apparaissent aussitôt partout.',
  'guide.privacyTitle': 'Confidentialité',
  'guide.privacyBody': 'Les appareils communiquent directement et de façon chiffrée sur le même réseau. L’app n’utilise aucun serveur ni service externe.',
  'sync.displaySection': 'Affichage client',
  'sync.displaySectionHint':
    "Connectez une tablette comme afficheur client — montre la commande en cours + total en grand.",
  'sync.pairDisplay': "Connecter l'afficheur",
  'sync.becomeDisplay': 'Utiliser comme afficheur',
  'sync.showDisplayOfferQr': 'Scannez ce code sur l’écran',
  'sync.displayScanInstruction': 'Sur l’écran, touchez « Utiliser comme écran » puis « Scanner le QR de la caisse ». Scannez ensuite son code réponse ici.',
  'sync.channelSync': 'Sync',
  'sync.channelDisplay': 'Afficheur',
  'display.title': 'Afficheur client',
  'display.intro': 'Cet appareil affiche la commande en cours pour les clients. Scannez le code de « Connecter l’écran » sur la caisse.',
  'display.scanCashier': 'Scanner le QR de la caisse',
  'display.showAnswer': 'Code de réponse',
  'display.showAnswerHint': 'Touchez « Scanner le code réponse » sur la caisse et scannez ce code.',
  'display.cancelPairing': 'Annuler',
  'display.connected': 'Connecté',
  'display.waiting': 'En attente de connexion',
  'display.exit': 'Quitter',
  'display.exitConfirm': 'Vraiment ?',
  'display.welcome': 'Bienvenue !',
  'display.welcomeHint': 'Que prendrez-vous ?',
  'display.currentOrder': 'Commande en cours',
  'display.enterFullscreen': 'Plein écran',
  'display.exitFullscreen': 'Quitter le plein écran',
  'sync.reconnectTitle': 'Connexion perdue',
  'sync.reconnectMasterBody': '{names} n’est plus connecté,',
  'sync.reconnectJoinerBody': 'La caisse principale « {name} » n’est plus connectée,',
  'sync.reconnectDisplayBody': 'L’écran « {name} » n’est plus connecté,',
  'sync.reconnectMasterQrReady':
    "Le QR est visible — les clients peuvent le scanner pour se reconnecter.",
  'sync.reconnectMasterPreparing': "Le QR va apparaître …",
  'sync.reconnectScanCta': 'Scanner le code de la caisse principale',
  'sync.reconnectDismiss': 'Ignorer',
  'sync.reconnectAgo': "il y a",
  'sync.reconnectJustNow': 'à l’instant',
  'display.reconnectTitle': 'Dernière connexion',
  'display.reconnectBody':
    "Cet afficheur était connecté à la caisse « {name} ». Reconnecter maintenant ?",
  'display.reconnectCta': "Se connecter à « {name} »",
  'display.reconnectDismiss': 'Oublier la dernière connexion',
  'sync.displaySingular': 'connecté',
  'sync.displayPlural': 'connectés',
  'sync.pairAnotherDisplay': 'Connecter un autre afficheur',
  'sync.displayOnlyActive': 'Liaison afficheur active',
  'nav.label': 'Navigation principale',
  'nav.order': 'Caisse',
  'nav.bilanz': 'Bilan',
  'nav.sortiment': 'Produits',
  'nav.devices': 'Appareils',
  'nav.settings': 'Réglages',
  'sale.complete': 'Encaisser',
  'sale.done': 'Encaissé : {amount}',
  'sale.discard': 'Vider',
  'sale.discardOrder': 'Vider la commande',
  'sale.discarded': 'Commande vidée',
  'sale.undo': 'Annuler',
  'sale.itemsOne': '1 article',
  'sale.itemsMany': '{n} articles',
  'sale.noItems': 'Rien ajouté',
  'sale.payout': 'À rendre',
  'totalbar.missing': 'Manque',
  'drink.a11yInOrder': '{n} dans la commande',
  'drink.addMany': 'Ajouter plusieurs {name}',
  'tip.roundTo': 'Arrondir à',
  'tip.custom': 'Saisir un pourboire',
  'numpad.tipTitle': 'Saisir le pourboire',
  'numpad.newTotal': 'Nouveau total',
  'numpad.baseTotal': 'Total sans pourboire',
  'numpad.input': 'Saisie',
  'numpad.comma': 'Virgule',
  'numpad.backspace': 'Effacer le dernier chiffre',
  'numpad.apply': 'Valider',
  'settings.themeSystem': 'Automatique',
  'settings.themeHint': 'Le clair se lit mieux au soleil, le sombre le soir.',
  'settings.sound': 'Sons',
  'settings.soundHint': 'Un son bref à chaque saisie.',
  'settings.keepAwake': 'Garder l’écran allumé',
  'settings.keepAwakeHint': 'Stabilise aussi la connexion aux autres appareils. Consomme un peu plus de batterie.',
  'settings.legal': 'Mentions légales',
  'settings.about': 'Stockage des données',
  'settings.privacy': 'Politique de confidentialité',
  'settings.imprint': 'Mentions légales',
  'settings.version': 'Version',
  'config.deleteConfirm': 'Sûr ?',
  'config.dangerTitle': 'Tout réinitialiser',
  'config.fileError': 'Le fichier n’a pas pu être lu.',
  'bilanz.disabledTitle': 'Le bilan du jour est désactivé',
  'bilanz.disabledBody': 'Activez-le pour enregistrer chaque vente et vérifier la caisse à la fin.',
  'bilanz.enable': 'Activer le bilan du jour',
  'bilanz.joinerTitle': 'Le bilan est sur la caisse principale',
  'bilanz.joinerBody': 'Les ventes de cette caisse y sont ajoutées automatiquement.',
  'app.loadError': 'Cette section n’a pas pu être chargée. Une nouvelle version est peut-être disponible, ou la connexion manque.',
  'app.reload': 'Recharger',
  'scanner.hint': 'Placez le code QR dans le cadre',
  'scanner.pasteLabel': 'Coller le code au lieu de scanner',
  'scanner.pasteHint': 'Touchez « Copier le code » sur l’autre appareil, envoyez-le ici et collez-le.',
  'scanner.pasteSubmit': 'Utiliser le code',
  'scanner.errDenied': 'L’accès à la caméra est bloqué. Autorisez-le dans les réglages du navigateur ou collez le code ci-dessous.',
  'scanner.errNoCamera': 'Aucune caméra trouvée. Collez le code ci-dessous.',
  'scanner.errGeneric': 'La caméra ne démarre pas. Collez le code ci-dessous.',
  'sync.startMasterHint': 'Cet appareil définit produits et réglages pour tous.',
  'sync.joinHint': 'Cet appareil adopte les produits et réglages de la caisse principale. Les ventes sont conservées.',
  'sync.addDevice': 'Connecter une autre caisse',
  'sync.answerInstruction': 'Touchez « Scanner le code réponse ». Les appareils sont alors connectés.',
  'sync.copyCode': 'Copier le code',
  'sync.codeCopied': 'Code copié',
  'sync.preparing': 'Création du code …',
  'sync.connecting': 'Connexion en cours …',
  'sync.connectingBody': 'Cela ne prend généralement que quelques secondes.',
  'sync.peerSynced': 'Données synchronisées à {time}',
  'sync.peerUnstable': 'Connexion instable, en attente de l’appareil …',
  'sync.peerVersion': 'Autre version de l’app ({version}). Rechargez les deux appareils une fois en ligne.',
  'sync.chipConnected': '{n} connecté(s)',
  'sync.chipError': 'Échec du couplage',
  'sync.chipPairing': 'Connexion …',
  'sync.chipUnstable': 'Connexion instable',
  'sync.bannerTitle': 'Pas de connexion à {names}',
  'sync.bannerBody': 'Les ventes restent enregistrées ici.',
  'sync.bannerAction': 'Reconnecter',
  'sync.sinceMinutes': 'depuis {n} min',
  'sync.sinceHours': 'depuis {n} h',
  'sync.reconnectSafe': 'Rien n’est perdu : les ventes sont fusionnées à la reconnexion. Recouplez une fois.',
  'sync.reconnectShowCta': 'Afficher le code de connexion',
  'sync.diagnostics': 'Copier le diagnostic pour le support',
  'sync.diagnosticsCopied': 'Diagnostic copié, sans données de vente',
  'sync.err.qr-invalid': 'Ce n’est pas un code de cette app. Visez le code dans l’onglet Appareils de l’autre appareil.',
  'sync.err.qr-outdated': 'L’autre appareil utilise une version plus ancienne. Rechargez-y l’app une fois en ligne.',
  'sync.err.qr-newer': 'L’autre appareil utilise une version plus récente. Rechargez ici l’app une fois en ligne.',
  'sync.err.qr-expected-offer': 'C’est un code réponse. Scannez ici le code de la caisse principale.',
  'sync.err.qr-expected-answer': 'Scannez le code réponse affiché sur l’autre appareil.',
  'sync.err.qr-wrong-mode': 'Ce code est pour l’autre mode. Les écrans utilisent « Connecter l’écran », les caisses « Démarrer comme caisse principale ».',
  'sync.err.session-mismatch': 'Ce code réponse provient d’une tentative précédente. Recommencez sur les deux appareils.',
  'sync.err.no-pairing': 'Aucun couplage en cours. Lancez-le d’abord sur la caisse principale.',
  'sync.err.role-conflict': 'Mettez d’abord fin à la connexion actuelle de cet appareil.',
  'sync.err.webrtc-unavailable': 'Ce navigateur n’autorise pas les connexions directes. Utilisez un navigateur récent et désactivez le mode Isolement d’iOS.',
  'sync.err.no-candidates': 'Aucun réseau trouvé. Connectez l’appareil au Wi-Fi ou à un partage de connexion et réessayez.',
  'sync.err.connect-timeout': 'Les appareils ne se joignent pas. Mettez-les sur le même Wi-Fi ou utilisez le partage de connexion d’un appareil, puis recommencez.',
  'sync.err.connect-failed': 'La connexion a échoué. Mettez les appareils sur le même Wi-Fi ou utilisez le partage de connexion, puis recommencez.',
  'sync.err.unknown': 'Cela n’a pas fonctionné. Veuillez réessayer.',
};

export const it: Translations = {
  'tabs.order': 'Ordine',
  'tabs.config': 'Configurazione',
  'header.newOrder': 'Nuovo ordine',
  'header.resetAll': 'Azzera tutto',
  'header.resetAllConfirm': 'Eliminare davvero tutto?',
  'header.storno': 'Annulla',
  'header.stornoActive': 'Modalità annulla',
  'header.soundOn': 'Suono attivo',
  'header.soundOff': 'Suono spento',
  'header.privacy': 'Privacy',
  'header.bilanz': 'Bilancio del giorno',
  'banner.stornoMode': 'Modalità annulla: il tap rimuove 1 pezzo',
  'order.title': 'Ordine',
  'order.empty': 'Nessun ordine',
  'order.emptyHint': 'Tocca una bevanda.',
  'order.tap': 'Tocca per aprire',
  'order.unitLabel': '/ pz',
  'order.removePosition': 'Rimuovi riga',
  'order.minusOne': 'Uno in meno',
  'order.plusOne': 'Uno in più',
  'pfand.return': 'Restituzione cauzione',
  'pfand.unitLabel': '/ pz',
  'totalbar.drinks': 'Bevande',
  'totalbar.pfand': '+ Cauzione',
  'totalbar.return': '− Reso',
  'totalbar.cash': 'Contanti',
  'totalbar.tip': '+ Mancia',
  'totalbar.total': 'Da pagare',
  'totalbar.given': 'Dato',
  'totalbar.change': 'Resto',
  'totalbar.exact': 'Esatto',
  'cash.given': 'Dato',
  'cash.cancel': 'Annulla',
  'cash.confirm': 'OK',
  'cash.customAmount': 'Inserisci importo',
  'cash.title': 'Contanti dal cliente',
  'tip.label': 'Mancia',
  'tip.plus50': '+0,50 €',
  'tip.plus1': '+1 €',
  'tip.roundUp5': 'A 5 €',
  'tip.roundUp10': 'A 10 €',
  'tip.clear': 'Rimuovi mancia',
  'drink.noPfand': 'senza cauzione',
  'drink.outOfStock': 'esaurito',
  'drink.stockLeft': 'rimasti',
  'config.toolbar.hint':
    'Tutte le impostazioni vengono salvate localmente su questo dispositivo (localStorage + IndexedDB) e sopravvivono al reload — nessun server cloud.',
  'config.export': 'Esporta prodotti',
  'config.import': 'Importa prodotti',
  'config.imported': 'Prodotti importati ✓',
  'config.sortimentBackupTitle': 'Backup prodotti',
  'config.sortimentBackupHint':
    'Salva la lista prodotti/cauzione come JSON o caricala da un altro dispositivo.',
  'config.pfandCategories': 'Categorie cauzione',
  'config.drinks': 'Prodotti',
  'config.newPfand': 'Nuova categoria cauzione',
  'config.newDrink': 'Nuovo prodotto',
  'config.subTabSortiment': 'Prodotti',
  'config.subTabSettings': 'Impostazioni',
  'config.subTabData': 'Dati',
  'config.dataDanger':
    "Attenzione: 'Azzera tutto' cancella prodotti, impostazioni e bilancio in modo permanente.",
  'config.add': 'Aggiungi',
  'config.label': 'Nome',
  'config.amount': 'Importo',
  'config.size': 'Dimensione',
  'config.price': 'Prezzo',
  'config.icon': 'Icona',
  'config.pfandType': 'Tipo cauzione',
  'config.noPfand': 'Senza cauzione',
  'config.happyHour': 'Happy Hour',
  'config.startTime': 'Inizio',
  'config.endTime': 'Fine',
  'config.priceEur': 'Prezzo €',
  'config.save': 'Salva',
  'config.discard': 'Annulla',
  'config.delete': 'Elimina',
  'config.noDrinks': 'Nessuna bevanda definita.',
  'config.noPfandTypes': 'Nessuna categoria cauzione definita.',
  'config.stockTitle': 'Scorta',
  'config.stockHint': 'Quantità disponibile — vuoto per illimitato.',
  'config.stockStart': 'Scorta iniziale',
  'config.stockUnlimited': 'illimitato',
  'settings.title': 'Impostazioni',
  'settings.language': 'Lingua',
  'settings.theme': 'Aspetto',
  'settings.themeDark': 'Scuro',
  'settings.themeLight': 'Chiaro',
  'settings.features': 'Funzioni opzionali',
  'settings.featureTip': 'Pulsanti mancia',
  'settings.featureTipHint':
    'Pulsanti rapidi +0,50 € / +1 € / arrotonda nell area contanti.',
  'settings.featureBilanz': 'Bilancio',
  'settings.featureBilanzHint':
    'Ogni ordine completato viene registrato e può essere modificato. Calcolo del cassetto previsto.',
  'settings.featureStock': 'Scorta',
  'settings.featureStockHint':
    'Imposta scorta iniziale per bevanda — la tile mostra il rimanente e blocca a 0.',
  'settings.cashStart': 'Cassa iniziale',
  'settings.cashStartHint':
    "Contanti in cassa a inizio turno — usati nel bilancio per calcolare il totale atteso.",
  'bilanz.title': 'Bilancio del giorno',
  'bilanz.empty': 'Nessun ordine completato.',
  'bilanz.entries': 'Voci',
  'bilanz.start': 'Cassa iniziale',
  'bilanz.summary': 'Riepilogo',
  'bilanz.gross': 'Incasso lordo',
  'bilanz.tipsTotal': 'Mance totali',
  'bilanz.expectedDrawer': 'Atteso in cassa',
  'bilanz.entryAt': 'Ordine alle',
  'bilanz.editEntry': 'Modifica',
  'bilanz.deleteEntry': 'Elimina',
  'bilanz.deleteAll': 'Svuota bilancio',
  'bilanz.deleteAllConfirm': 'Eliminare tutte le voci?',
  'bilanz.itemsCount': 'Articoli',
  'bilanz.payment': 'Pagamento',
  'bilanz.paymentCash': 'Contanti',
  'bilanz.paymentCard': 'Carta',
  'bilanz.paymentOther': 'Altro',
  'bilanz.byProduct': 'Venduto per prodotto',
  'bilanz.unitsSold': 'venduti',
  'bilanz.export': 'Esporta CSV',
  'bilanz.exportHint': 'Esporta il bilancio come CSV per Excel/Numbers',
  'bilanz.print': 'Stampa',
  'bilanz.printHint': 'Mostra il bilancio in una vista stampabile',
  'config.bilanzBackupTitle': 'Backup del bilancio',
  'config.bilanzBackupHint':
    "Esporta il bilancio come JSON — può essere reimportato (cambio dispositivo, reset). Attuale:",
  'config.bilanzExport': 'Esporta bilancio',
  'config.bilanzImport': 'Importa bilancio',
  'config.bilanzImported': 'Bilancio importato ✓',
  'config.bilanzImportConfirmTitle': 'Sostituire davvero il bilancio?',
  'config.bilanzImportConfirmBody':
    "{new} voci verranno caricate, {old} voci esistenti sostituite. Operazione irreversibile.",
  'config.bilanzImportConfirm': 'Sì, sostituisci',
  'modal.close': 'Chiudi',
  'modal.understand': 'Capito',
  'common.yes': 'Sì',
  'common.no': 'No',
  'common.save': 'Salva',
  'common.cancel': 'Annulla',
  'config.subTabSync': 'Dispositivi',
  'sync.title': 'Collega dispositivi',
  'sync.idle': 'Non ancora collegato',
  'sync.role.master': 'Questo dispositivo è la cassa principale',
  'sync.role.joiner': 'Questo dispositivo è una cassa secondaria',
  'sync.startMaster': 'Avvia come cassa principale',
  'sync.joinAsClient': 'Collega alla cassa principale',
  'sync.cancelPairing': 'Annulla',
  'sync.disconnect': 'Termina connessione',
  'sync.peers': 'dispositivi connessi',
  'sync.scanInstruction': 'Tocca “Collega alla cassa principale”. Il dispositivo mostrerà un codice di risposta da scansionare qui.',
  'sync.showOfferQr': 'Passo 1: scansiona questo codice sull’altro dispositivo',
  'sync.showAnswerQr': 'Passo 2: scansiona questo codice sulla cassa principale',
  'sync.scanOffer': 'Scansiona il codice della cassa principale',
  'sync.scanAnswer': 'Scansiona codice di risposta',
  'sync.connected': 'Connesso',
  'sync.connectingHint': 'Entrambi i dispositivi devono essere sulla stessa Wi-Fi o sull’hotspot di uno dei due. Le Wi-Fi pubbliche spesso bloccano le connessioni tra dispositivi.',
  'sync.intro': 'Più casse condividono prodotti, scorte e bilancio. Direttamente tra i dispositivi, senza account.',
  'sync.privacyHint': 'I dati passano cifrati, direttamente tra i dispositivi. L’app non usa server né servizi esterni.',
  'sync.statusBadge': 'Sync',
  'sync.errorScan': 'QR code non leggibile:',
  'sync.adoptShared':
    "La lista prodotti del master viene adottata; i bilanci vengono uniti.",
  'sync.session': 'Sessione',
  'sync.notReady': 'Sync in preparazione …',
  'sync.joinerReadOnly': 'Cassa secondaria: prodotti e impostazioni condivise arrivano dalla cassa principale. Lingua e aspetto restano locali.',
  'sync.peerLabel': 'Dispositivo',
  'sync.peerSince': 'collegato dalle',
  'sync.kickPeer': 'Scollega',
  'sync.kickConfirm': 'Sicuro?',
  'sync.deviceNameLabel': 'Nome dispositivo',
  'sync.deviceNamePlaceholder': 'es. Banco, Aiuto …',
  'sync.deviceNameHint':
    'Mostrato per voce nel bilancio del giorno e durante il pairing.',
  'sync.openGuide': 'Apri guida',
  'guide.title': 'Come collegare i dispositivi',
  'guide.subtitle': 'Direttamente con codice QR, senza account.',
  'guide.prereqTitle': 'Prerequisiti',
  'guide.prereqWifi': 'Entrambi i dispositivi sulla stessa Wi-Fi o sull’hotspot di uno dei due. Poi Internet non serve.',
  'guide.prereqCamera': 'Una fotocamera su entrambi i dispositivi. In alternativa, il codice si può copiare e incollare.',
  'guide.prereqBrowser':
    'Browser moderno (Chrome, Safari, Firefox, Edge degli ultimi 2 anni).',
  'guide.s1Title': 'Imposta nome dispositivo',
  'guide.s1Body':
    'Su ogni dispositivo imposta un nome significativo nella scheda Sync (es. "Banco" o "Aiuto"). Il nome appare per ordine nel bilancio e durante il pairing sugli altri dispositivi.',
  'guide.s2Title': 'Cassa principale: avvia il collegamento',
  'guide.s2Body': 'Sul dispositivo con i prodotti corretti tocca “Avvia come cassa principale”. L’app mostra un codice QR. Lascialo visibile.',
  'guide.s2Hint': 'Importante: la cassa principale imposta prodotti e impostazioni per tutti. I prodotti delle casse secondarie vengono sostituiti, le vendite restano.',
  'guide.s3Title': 'Cassa secondaria: scansiona il codice',
  'guide.s3Body': 'Su ogni altro dispositivo tocca “Collega alla cassa principale” e inquadra il codice. Mostrerà un codice di risposta.',
  'guide.s3Hint':
    'Nota: l app chiede il permesso fotocamera al primo scan. Permettilo.',
  'guide.s4Title': 'Cassa principale: scansiona la risposta',
  'guide.s4Body': 'Sulla cassa principale tocca “Scansiona codice di risposta” e inquadra il codice dell’altro dispositivo.',
  'guide.s5Title': 'Connesso!',
  'guide.s5Body': 'Prodotti, scorte e bilancio sono ora uguali su tutti i dispositivi.',
  'guide.s5b1':
    'Gli ordini completati su un dispositivo appaiono subito sugli altri.',
  'guide.s5b2': 'La scorta diminuisce su tutti i dispositivi insieme.',
  'guide.s5b3':
    'Ogni voce del bilancio mostra il dispositivo che ha creato l ordine.',
  'guide.moreDevicesTitle': 'Aggiungere altri dispositivi',
  'guide.moreDevicesBody': 'Sulla cassa principale tocca “Collega un’altra cassa” e ripeti i passi 3 e 4 per ogni dispositivo.',
  'guide.troubleTitle': 'Problemi comuni',
  'guide.troubleQ1': 'Il QR non viene rilevato.',
  'guide.troubleA1': 'Aumenta la luminosità, tieni 15–25 cm di distanza, evita i riflessi. Altrimenti copia il codice e incollalo sull’altro dispositivo.',
  'guide.troubleQ2': 'Connessione che cade o non si stabilisce.',
  'guide.troubleA2': 'Entrambi i dispositivi devono essere sulla stessa rete; i dati mobili non funzionano. Le Wi-Fi pubbliche spesso bloccano queste connessioni. L’hotspot di un dispositivo è il più affidabile, anche senza Internet.',
  'guide.troubleQ3': 'Appare “Connessione persa”.',
  'guide.troubleA3': 'Succede se un dispositivo è rimasto bloccato o ha cambiato rete. Non si perde nulla: ricollega e le vendite vengono unite. “Mantieni schermo acceso” nelle impostazioni aiuta a prevenirlo.',
  'guide.troubleQ4': 'Una cassa secondaria non può modificare i prodotti.',
  'guide.troubleA4': 'È voluto: la cassa principale è il riferimento, così i prezzi sono uguali ovunque. Le modifiche appaiono subito su tutti i dispositivi.',
  'guide.privacyTitle': 'Privacy',
  'guide.privacyBody': 'I dispositivi comunicano direttamente e in modo cifrato sulla stessa rete. L’app non usa server né servizi esterni.',
  'sync.displaySection': 'Display cliente',
  'sync.displaySectionHint':
    'Collega un tablet come display cliente — mostra l ordine in corso + totale in grande.',
  'sync.pairDisplay': 'Collega display',
  'sync.becomeDisplay': 'Usa come display',
  'sync.showDisplayOfferQr': 'Scansiona questo codice sul display',
  'sync.displayScanInstruction': 'Sul display tocca “Usa come display” e poi “Scansiona QR cassa”. Poi scansiona qui il suo codice di risposta.',
  'sync.channelSync': 'Sync',
  'sync.channelDisplay': 'Display',
  'display.title': 'Display cliente',
  'display.intro': 'Questo dispositivo mostra ai clienti l’ordine in corso. Scansiona il codice di “Collega display” sulla cassa.',
  'display.scanCashier': 'Scansiona QR cassa',
  'display.showAnswer': 'Codice risposta',
  'display.showAnswerHint': 'Tocca “Scansiona codice di risposta” sulla cassa e scansiona questo codice.',
  'display.cancelPairing': 'Annulla',
  'display.connected': 'Connesso',
  'display.waiting': 'In attesa di connessione',
  'display.exit': 'Esci',
  'display.exitConfirm': 'Sicuro?',
  'display.welcome': 'Benvenuti!',
  'display.welcomeHint': 'Cosa desidera?',
  'display.currentOrder': 'Ordine corrente',
  'display.enterFullscreen': 'Schermo intero',
  'display.exitFullscreen': 'Esci dallo schermo intero',
  'sync.reconnectTitle': 'Connessione persa',
  'sync.reconnectMasterBody': '{names} non è più collegato,',
  'sync.reconnectJoinerBody': 'La cassa principale “{name}” non è più collegata,',
  'sync.reconnectDisplayBody': 'Il display “{name}” non è più collegato,',
  'sync.reconnectMasterQrReady':
    "Il QR è visibile — i joiner possono scansionarlo per riconnettersi.",
  'sync.reconnectMasterPreparing': "Il QR apparirà a breve …",
  'sync.reconnectScanCta': 'Scansiona il codice della cassa principale',
  'sync.reconnectDismiss': 'Ignora',
  'sync.reconnectAgo': 'fa',
  'sync.reconnectJustNow': 'proprio ora',
  'display.reconnectTitle': 'Ultima connessione',
  'display.reconnectBody':
    "Questo display era connesso alla cassa « {name} ». Riconnetti ora?",
  'display.reconnectCta': 'Connetti a « {name} »',
  'display.reconnectDismiss': "Dimentica l ultima connessione",
  'sync.displaySingular': 'connesso',
  'sync.displayPlural': 'connessi',
  'sync.pairAnotherDisplay': 'Collega altro display',
  'sync.displayOnlyActive': 'Connessione display attiva',
  'nav.label': 'Navigazione principale',
  'nav.order': 'Cassa',
  'nav.bilanz': 'Bilancio',
  'nav.sortiment': 'Prodotti',
  'nav.devices': 'Dispositivi',
  'nav.settings': 'Opzioni',
  'sale.complete': 'Incassa',
  'sale.done': 'Incassato: {amount}',
  'sale.discard': 'Svuota',
  'sale.discardOrder': 'Svuota ordine',
  'sale.discarded': 'Ordine svuotato',
  'sale.undo': 'Annulla',
  'sale.itemsOne': '1 articolo',
  'sale.itemsMany': '{n} articoli',
  'sale.noItems': 'Nessun articolo',
  'sale.payout': 'Da restituire',
  'totalbar.missing': 'Mancano',
  'drink.a11yInOrder': '{n} nell’ordine',
  'drink.addMany': 'Aggiungi più {name}',
  'tip.roundTo': 'Arrotonda a',
  'tip.custom': 'Inserisci mancia',
  'numpad.tipTitle': 'Inserisci mancia',
  'numpad.newTotal': 'Nuovo totale',
  'numpad.baseTotal': 'Totale senza mancia',
  'numpad.input': 'Importo',
  'numpad.comma': 'Virgola',
  'numpad.backspace': 'Cancella ultima cifra',
  'numpad.apply': 'Conferma',
  'settings.themeSystem': 'Automatico',
  'settings.themeHint': 'Il chiaro si legge meglio al sole, lo scuro la sera.',
  'settings.sound': 'Suoni',
  'settings.soundHint': 'Un breve suono a ogni inserimento.',
  'settings.keepAwake': 'Mantieni schermo acceso',
  'settings.keepAwakeHint': 'Mantiene stabile anche la connessione agli altri dispositivi. Consuma un po’ più di batteria.',
  'settings.legal': 'Note legali',
  'settings.about': 'Come vengono salvati i dati',
  'settings.privacy': 'Informativa sulla privacy',
  'settings.imprint': 'Note legali',
  'settings.version': 'Versione',
  'config.deleteConfirm': 'Sicuro?',
  'config.dangerTitle': 'Ripristina tutto',
  'config.fileError': 'Impossibile leggere il file.',
  'bilanz.disabledTitle': 'Il bilancio giornaliero è disattivato',
  'bilanz.disabledBody': 'Attivalo per registrare ogni vendita e controllare la cassa alla fine.',
  'bilanz.enable': 'Attiva bilancio giornaliero',
  'bilanz.joinerTitle': 'Il bilancio è sulla cassa principale',
  'bilanz.joinerBody': 'Le vendite di questa cassa vengono aggiunte automaticamente.',
  'app.loadError': 'Impossibile caricare questa sezione. Forse è disponibile una nuova versione o manca la connessione.',
  'app.reload': 'Ricarica',
  'scanner.hint': 'Inquadra il codice QR',
  'scanner.pasteLabel': 'Incolla il codice invece di scansionare',
  'scanner.pasteHint': 'Tocca “Copia codice” sull’altro dispositivo, invialo qui e incollalo.',
  'scanner.pasteSubmit': 'Usa codice',
  'scanner.errDenied': 'L’accesso alla fotocamera è bloccato. Consentilo nelle impostazioni del browser o incolla il codice qui sotto.',
  'scanner.errNoCamera': 'Nessuna fotocamera trovata. Incolla il codice qui sotto.',
  'scanner.errGeneric': 'La fotocamera non si avvia. Incolla il codice qui sotto.',
  'sync.startMasterHint': 'Questo dispositivo imposta prodotti e impostazioni per tutti.',
  'sync.joinHint': 'Questo dispositivo adotta prodotti e impostazioni della cassa principale. Le vendite restano.',
  'sync.addDevice': 'Collega un’altra cassa',
  'sync.answerInstruction': 'Tocca “Scansiona codice di risposta”. I dispositivi saranno collegati.',
  'sync.copyCode': 'Copia codice',
  'sync.codeCopied': 'Codice copiato',
  'sync.preparing': 'Creazione del codice …',
  'sync.connecting': 'Connessione in corso …',
  'sync.connectingBody': 'Di solito bastano pochi secondi.',
  'sync.peerSynced': 'Dati sincronizzati alle {time}',
  'sync.peerUnstable': 'Connessione instabile, in attesa del dispositivo …',
  'sync.peerVersion': 'Altra versione dell’app ({version}). Ricarica entrambi i dispositivi quando sei online.',
  'sync.chipConnected': '{n} collegati',
  'sync.chipError': 'Abbinamento non riuscito',
  'sync.chipPairing': 'Collegamento …',
  'sync.chipUnstable': 'Connessione instabile',
  'sync.bannerTitle': 'Nessuna connessione a {names}',
  'sync.bannerBody': 'Le vendite restano salvate qui.',
  'sync.bannerAction': 'Ricollega',
  'sync.sinceMinutes': 'da {n} min',
  'sync.sinceHours': 'da {n} h',
  'sync.reconnectSafe': 'Non si perde nulla: le vendite vengono unite al ricollegamento. Basta abbinare di nuovo.',
  'sync.reconnectShowCta': 'Mostra codice di collegamento',
  'sync.diagnostics': 'Copia diagnostica per l’assistenza',
  'sync.diagnosticsCopied': 'Diagnostica copiata, senza dati di vendita',
  'sync.err.qr-invalid': 'Non è un codice di questa app. Inquadra il codice nella scheda Dispositivi dell’altro dispositivo.',
  'sync.err.qr-outdated': 'L’altro dispositivo usa una versione più vecchia. Ricarica lì l’app una volta online.',
  'sync.err.qr-newer': 'L’altro dispositivo usa una versione più recente. Ricarica qui l’app una volta online.',
  'sync.err.qr-expected-offer': 'È un codice di risposta. Scansiona qui il codice della cassa principale.',
  'sync.err.qr-expected-answer': 'Scansiona il codice di risposta mostrato sull’altro dispositivo.',
  'sync.err.qr-wrong-mode': 'Questo codice è per l’altra modalità. I display usano “Collega display”, le casse “Avvia come cassa principale”.',
  'sync.err.session-mismatch': 'Questo codice di risposta è di un tentativo precedente. Ricomincia su entrambi i dispositivi.',
  'sync.err.no-pairing': 'Nessun abbinamento in corso. Avvialo prima sulla cassa principale.',
  'sync.err.role-conflict': 'Termina prima la connessione attuale di questo dispositivo.',
  'sync.err.webrtc-unavailable': 'Questo browser non consente connessioni dirette. Usa un browser aggiornato e disattiva la modalità di isolamento di iOS.',
  'sync.err.no-candidates': 'Nessuna rete trovata. Collega il dispositivo a una Wi-Fi o un hotspot e riprova.',
  'sync.err.connect-timeout': 'I dispositivi non si raggiungono. Mettili sulla stessa Wi-Fi o usa l’hotspot di uno dei due, poi riprova.',
  'sync.err.connect-failed': 'Connessione non riuscita. Metti i dispositivi sulla stessa Wi-Fi o usa un hotspot, poi riprova.',
  'sync.err.unknown': 'Non ha funzionato. Riprova.',
};
