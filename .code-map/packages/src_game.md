# Package: src/game


## `src/game/ai.ts`

- `<module>` (module) — `src/game/ai.ts:<module>`
- `PayCard` (class) — `ai.PayCard`
- `cardScore` (function) — `ai.cardScore`
- `chooseAction` (function) — `ai.chooseAction`
- `chooseDiscards` (function) — `ai.chooseDiscards`
- `chooseResponse` (function) — `ai.chooseResponse`
- `scoreAction` (function) — `ai.scoreAction`

## `src/game/constants.ts`

- `<module>` (module) — `src/game/constants.ts:<module>`
- `ALL_CARDS` (constant) — `constants.ALL_CARDS`
- `CARD_COLORS` (constant) — `constants.CARD_COLORS`
- `COLOR_DISPLAY` (constant) — `constants.COLOR_DISPLAY`
- `RENT_VALUES` (constant) — `constants.RENT_VALUES`
- `SET_SIZES` (constant) — `constants.SET_SIZES`
- `actionCards` (function) — `constants.actionCards`
- `moneyCards` (function) — `constants.moneyCards`
- `nextId` (function) — `constants.nextId`
- `propertyCards` (function) — `constants.propertyCards`
- `rentCards` (function) — `constants.rentCards`
- `wildPropertyCards` (function) — `constants.wildPropertyCards`

## `src/game/deck.ts`

- `<module>` (module) — `src/game/deck.ts:<module>`
- `createDeck` (function) — `deck.createDeck`
- `dealInitialHands` (function) — `deck.dealInitialHands`
- `drawCards` (function) — `deck.drawCards`
- `shuffle` (function) — `deck.shuffle`

## `src/game/engine.ts`

- `<module>` (module) — `src/game/engine.ts:<module>`
- `addToPropertySet` (function) — `engine.addToPropertySet`
- `applyAction` (function) — `engine.applyAction`
- `applyBankCard` (function) — `engine.applyBankCard`
- `applyDiscard` (function) — `engine.applyDiscard`
- `applyMoveWild` (function) — `engine.applyMoveWild`
- `applyPass` (function) — `engine.applyPass`
- `applyPlayAction` (function) — `engine.applyPlayAction`
- `applyPlayProperty` (function) — `engine.applyPlayProperty`
- `applyRespond` (function) — `engine.applyRespond`
- `cardName` (function) — `engine.cardName`
- `checkWin` (function) — `engine.checkWin`
- `clonePlayers` (function) — `engine.clonePlayers`
- `colorLabel` (function) — `engine.colorLabel`
- `countCompleteSets` (function) — `engine.countCompleteSets`
- `createGame` (function) — `engine.createGame`
- `ensureDeck` (function) — `engine.ensureDeck`
- `getRentAmount` (function) — `engine.getRentAmount`
- `getValidActions` (function) — `engine.getValidActions`
- `isSetComplete` (function) — `engine.isSetComplete`
- `maybeEndTurn` (function) — `engine.maybeEndTurn`
- `otherPlayer` (function) — `engine.otherPlayer`
- `performDraw` (function) — `engine.performDraw`
- `removeCard` (function) — `engine.removeCard`
- `removePropertyCard` (function) — `engine.removePropertyCard`
- `resolveAccept` (function) — `engine.resolveAccept`
- `startEndTurn` (function) — `engine.startEndTurn`
- `switchTurn` (function) — `engine.switchTurn`
- `withWinCheck` (function) — `engine.withWinCheck`

## `src/game/types.ts`

- `<module>` (module) — `src/game/types.ts:<module>`
- `ActionCard` (class) — `types.ActionCard`
- `BankCardAction` (class) — `types.BankCardAction`
- `DiscardAction` (class) — `types.DiscardAction`
- `GameState` (class) — `types.GameState`
- `LogEntry` (class) — `types.LogEntry`
- `MoneyCard` (class) — `types.MoneyCard`
- `MoveWildAction` (class) — `types.MoveWildAction`
- `PassAction` (class) — `types.PassAction`
- `PendingAction` (class) — `types.PendingAction`
- `PlayActionAction` (class) — `types.PlayActionAction`
- `PlayPropertyAction` (class) — `types.PlayPropertyAction`
- `PlayerState` (class) — `types.PlayerState`
- `PropertyCard` (class) — `types.PropertyCard`
- `PropertySet` (class) — `types.PropertySet`
- `RentCard` (class) — `types.RentCard`
- `RespondAction` (class) — `types.RespondAction`
- `WildPropertyCard` (class) — `types.WildPropertyCard`
