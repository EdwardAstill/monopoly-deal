# Code Map

- files: 24
- symbols: 145
- edges: 223
- languages: typescript
- last built: 2026-05-07T10:49:24+00:00

## Top files (by PageRank)
- `src/game/types.ts` [typescript, 145 loc, rank 0.2910, in 42 / out 0] — `<module>` (module), `ActionCard` (class), `BankCardAction` (class), `DiscardAction` (class), `GameState` (class), `LogEntry` (class), `MoneyCard` (class), `MoveWildAction` (class)
- `src/game/constants.ts` [typescript, 150 loc, rank 0.1300, in 36 / out 15] — `<module>` (module), `ALL_CARDS` (constant), `CARD_COLORS` (constant), `COLOR_DISPLAY` (constant), `RENT_VALUES` (constant), `SET_SIZES` (constant), `actionCards` (function), `moneyCards` (function)
- `src/components/theme.ts` [typescript, 170 loc, rank 0.0780, in 18 / out 2] — `<module>` (module), `BANK_CARD_SIZE` (constant), `CARD_SIZE` (constant), `CARD_SIZE_SMALL` (constant), `COLORS` (constant), `cardColor` (function), `cardDisplayName` (function), `cardSubtitle` (function)
- `src/game/engine.ts` [typescript, 879 loc, rank 0.0456, in 70 / out 73] — `<module>` (module), `addToPropertySet` (function), `applyAction` (function), `applyBankCard` (function), `applyDiscard` (function), `applyMoveWild` (function), `applyPass` (function), `applyPlayAction` (function)
- `src/game/ai.ts` [typescript, 186 loc, rank 0.0346, in 11 / out 10] — `<module>` (module), `PayCard` (class), `cardScore` (function), `chooseAction` (function), `chooseDiscards` (function), `chooseResponse` (function), `scoreAction` (function)
- `src/game/deck.ts` [typescript, 47 loc, rank 0.0340, in 7 / out 2] — `<module>` (module), `createDeck` (function), `dealInitialHands` (function), `drawCards` (function), `shuffle` (function)
- `src/components/App.tsx` [typescript, 38 loc, rank 0.0330, in 1 / out 3] — `<module>` (module), `App` (function)
- `src/components/CardView.tsx` [typescript, 351 loc, rank 0.0317, in 4 / out 13] — `<module>` (module), `CardPopup` (function), `CardView` (function), `CardViewProps` (class), `hexWithAlpha` (function)
- `src/components/Board.tsx` [typescript, 190 loc, rank 0.0272, in 1 / out 10] — `<module>` (module), `Board` (function), `BoardProps` (class), `DeckInfo` (function)
- `src/hooks/useGame.ts` [typescript, 84 loc, rank 0.0272, in 1 / out 7] — `<module>` (module), `gameReducer` (function), `useGame` (function)
- `src/components/Bank.tsx` [typescript, 90 loc, rank 0.0231, in 2 / out 2] — `<module>` (module), `Bank` (function), `BankProps` (class)
- `src/components/PropertyArea.tsx` [typescript, 186 loc, rank 0.0231, in 3 / out 8] — `<module>` (module), `AddSlot` (function), `AddSlotProps` (class), `PropertyArea` (function), `PropertyAreaProps` (class), `getRentAmount` (function)
- `src/components/ActionButtons.tsx` [typescript, 535 loc, rank 0.0197, in 1 / out 4] — `<module>` (module), `ActionButtons` (function), `ActionButtonsProps` (class), `ForcedDealModal` (function), `ForcedDealModalProps` (class), `RespondPanel` (function), `RespondPanelProps` (class)
- `src/components/ActionLog.tsx` [typescript, 52 loc, rank 0.0197, in 1 / out 2] — `<module>` (module), `ActionLog` (function), `ActionLogProps` (class)
- `src/components/Hand.tsx` [typescript, 30 loc, rank 0.0197, in 1 / out 1] — `<module>` (module), `Hand` (function), `HandProps` (class)
- `src/components/OpponentView.tsx` [typescript, 41 loc, rank 0.0197, in 1 / out 5] — `<module>` (module), `OpponentView` (function), `OpponentViewProps` (class)
- `src/main.tsx` [typescript, 11 loc, rank 0.0178, in 0 / out 1] — `<module>` (module)
- `src/vite-env.d.ts` [typescript, 2 loc, rank 0.0178, in 0 / out 0] — `<module>` (module)
- `tests/game/ai.test.ts` [typescript, 153 loc, rank 0.0178, in 9 / out 21] — `<module>` (module), `baseState` (function), `clonePlayers` (function), `makeAction` (function), `makeMoney` (function), `makeProperty` (function), `makeSet` (function), `nextId` (function)
- `tests/game/constants.test.ts` [typescript, 49 loc, rank 0.0178, in 0 / out 4] — `<module>` (module)
- `tests/game/deck.test.ts` [typescript, 38 loc, rank 0.0178, in 0 / out 4] — `<module>` (module)
- `tests/game/engine.test.ts` [typescript, 790 loc, rank 0.0178, in 14 / out 27] — `<module>` (module), `emptyPlayer` (function), `makeAction` (function), `makeCompleteSet` (function), `makeMoney` (function), `makeProperty` (function), `makeRent` (function), `makeState` (function)
- `tests/game/integration.test.ts` [typescript, 55 loc, rank 0.0178, in 0 / out 9] — `<module>` (module)
- `vite.config.ts` [typescript, 12 loc, rank 0.0178, in 0 / out 0] — `<module>` (module)

See `README.md` in this directory for the schema and the static-analysis blind-spot list.
