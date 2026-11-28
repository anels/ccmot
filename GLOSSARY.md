# Credit Card Offer Tracking

One person's record of the promotional offers available on their credit cards, and how far each one has got towards paying out.

## Language

**Offer**:
A merchant promotion that is valid through its expiry date. It exists whether or not any card is tracking it, and after that date it cannot be put on any further Card.
_Avoid_: Deal, promotion

**Catalog**:
All the Offers on record, whether tracked or not.

**Card**:
A credit card the person holds.

**Card Type**:
A kind of credit card, such as a particular issuer's product, that sets the issuer and color of its Cards and carries their Rewards. A Card keeps that appearance if its Card Type is deleted.
_Avoid_: Template, card product, catalog

**Reward**:
The rate a Card Type earns on spending in one Category, given as a value and a unit: percent, multiplier or points.
_Avoid_: Reward rule, earn rate

**Category**:
A kind of spending that Offers and Rewards are filed under. The built-in ones can be extended with the person's own.

**Tracked Offer**:
One Offer on one Card, with its own Status. The same Offer on two Cards is two Tracked Offers.

**Status**:
How far a Tracked Offer has got: **Added** (on the Card, not yet used), **Used** (the qualifying purchase is made, reward pending) or **Awarded** (reward received).
_Avoid_: State, stage

**Expired**:
A Tracked Offer still Added after its Offer's expiry date has passed. A Used or Awarded Tracked Offer never expires, and an Expired one can still be marked Used if the purchase was made in time.
