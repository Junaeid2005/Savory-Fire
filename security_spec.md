# Savory Green - Security Specification

This security specification outlines the data invariants, malicious "Dirty Dozen" threat vectors, and verification patterns designed to protect the "Savory Green" restaurant database from unauthorized state transitions and access.

## Data Invariants

1. **User Identity Security**: Users can only read and write their own profile in the `/users/{userId}` collection. Only a verified user matching the document ID can register their profile. Users cannot set themselves as admin.
2. **Menu Integrity**: Only designated administrators can create, update, or delete food items in the `/food_items/{itemId}` collection. General users and unauthenticated guests can only read available items.
3. **Order Authenticity**: Users can only place orders under their own authentication identifier (`userId` and `userEmail`).
4. **Immutability of Orders**: Once placed, an order's reference number, items, and total price cannot be altered by anyone.
5. **Admin-Only State Transitions (Payment Status)**: Only designated administrators can transition an order's `paymentStatus` from `"pending"` to `"paid"`.
6. **Temporal Validity**: All timestamps (`createdAt`, `updatedAt`) must strictly match the database's server time (`request.time`).
7. **Value Bounds**: Pricing and quantities must be strictly positive numeric values.

---

## The "Dirty Dozen" Threat Payloads

Here are the 12 specific threat payloads designed to break our data invariants, which our security rules must actively reject with `PERMISSION_DENIED`.

### 1. The Admin Escalation Payload
* **Target Path**: `/users/attacker_uid`
* **Vulnerability Target**: User tries to register or update themselves as an administrator.
* **Payload**:
  ```json
  {
    "email": "attacker@gmail.com",
    "isAdmin": true,
    "createdAt": "serverTimestamp"
  }
  ```

### 2. The Rogue Menu Insert (Anonymous)
* **Target Path**: `/food_items/rogue_burger`
* **Vulnerability Target**: Unauthenticated client attempts to add a free item to the menu.
* **Payload**:
  ```json
  {
    "name": "Free Golden Burger",
    "price": 0.0,
    "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    "description": "Exploit burger",
    "category": "burgers",
    "isAvailable": true
  }
  ```

### 3. The Menu Price Tamper (Authenticated User)
* **Target Path**: `/food_items/existing_item_id`
* **Vulnerability Target**: A standard customer attempts to lower the price of an active item.
* **Payload**:
  ```json
  {
    "price": 0.01
  }
  ```

### 4. The Order Spoofing Payload (Identity Theft)
* **Target Path**: `/orders/some_fake_order`
* **Vulnerability Target**: Attacker logs in and tries to place an order under another user's email address.
* **Payload**:
  ```json
  {
    "userId": "victim_uid",
    "userEmail": "victim_user@gmail.com",
    "items": [{ "name": "Steak", "price": 45, "quantity": 1 }],
    "totalPrice": 45,
    "referenceNumber": "1234",
    "paymentStatus": "pending",
    "createdAt": "serverTimestamp"
  }
  ```

### 5. The Pre-Approved Order Exploit
* **Target Path**: `/orders/order_xyz`
* **Vulnerability Target**: Attacker creates an order with its payment status pre-set to `"paid"`.
* **Payload**:
  ```json
  {
    "userId": "attacker_uid",
    "userEmail": "attacker@gmail.com",
    "items": [{ "name": "Pasta", "price": 12, "quantity": 2 }],
    "totalPrice": 24,
    "referenceNumber": "5555",
    "paymentStatus": "paid",
    "createdAt": "serverTimestamp"
  }
  ```

### 6. The Post-Order Price Hack
* **Target Path**: `/orders/existing_order_id`
* **Vulnerability Target**: User attempts to update the total price of their existing order to $0.
* **Payload**:
  ```json
  {
    "totalPrice": 0
  }
  ```

### 7. The Payment Status Hijack
* **Target Path**: `/orders/existing_order_id`
* **Vulnerability Target**: Customer attempts to directly update their pending order status to `"paid"` without actually paying.
* **Payload**:
  ```json
  {
    "paymentStatus": "paid"
  }
  ```

### 8. The Ghost Field Injection (Resource Poisoning)
* **Target Path**: `/orders/attacker_order`
* **Vulnerability Target**: User injects massive garbage payloads or extra unvalidated parameters ("ghost fields") into the order object.
* **Payload**:
  ```json
  {
    "userId": "attacker_uid",
    "userEmail": "attacker@gmail.com",
    "items": [],
    "totalPrice": 0,
    "referenceNumber": "8888",
    "paymentStatus": "pending",
    "createdAt": "serverTimestamp",
    "ghostField_attackVector": "A".repeat(10000)
  }
  ```

### 9. The Zero-Cost Order Exploit
* **Target Path**: `/orders/zero_cost_order`
* **Vulnerability Target**: User places a real order but sets the total price to a negative value or zero.
* **Payload**:
  ```json
  {
    "userId": "attacker_uid",
    "userEmail": "attacker@gmail.com",
    "items": [{ "name": "Feast", "price": -100, "quantity": 1 }],
    "totalPrice": -100,
    "referenceNumber": "9999",
    "paymentStatus": "pending",
    "createdAt": "serverTimestamp"
  }
  ```

### 10. The Temporal Deception (Fake Date)
* **Target Path**: `/orders/date_exploit`
* **Vulnerability Target**: Client specifies a historical or future date to disrupt billing logs.
* **Payload**:
  ```json
  {
    "userId": "attacker_uid",
    "userEmail": "attacker@gmail.com",
    "items": [{ "name": "Salad", "price": 10, "quantity": 1 }],
    "totalPrice": 10,
    "referenceNumber": "1111",
    "paymentStatus": "pending",
    "createdAt": "2020-01-01T00:00:00Z"
  }
  ```

### 11. The Admin Privilege Hijack via Metadata
* **Target Path**: `/users/attacker_uid`
* **Vulnerability Target**: User tries to change their email to match an admin email and toggle admin flags during account updates.
* **Payload**:
  ```json
  {
    "email": "junaeid2.0shohan@gmail.com",
    "isAdmin": true
  }
  ```

### 12. The Order Deletion Exploit
* **Target Path**: `/orders/completed_order_id`
* **Vulnerability Target**: Standard user tries to delete an active or paid order to erase their record.
* **Payload**: `DELETE request` (Should fail unless admin, or completely forbidden for customers once placed).

---

## Verification Test Runner Suite

The following structure represents a virtual `firestore.rules.test.ts` that enforces permission denials on these threat vectors.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Savory Green Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'restaurant22-d6f98',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('rejects Dirty Payload 1: Admin Escalation', async () => {
    const unauthDb = testEnv.authenticatedContext('attacker_uid').firestore();
    const docRef = unauthDb.collection('users').doc('attacker_uid');
    await assertFails(docRef.set({
      email: 'attacker@gmail.com',
      isAdmin: true,
      createdAt: new Date()
    }));
  });

  it('rejects Dirty Payload 2: Anonymous Menu Modification', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    const docRef = anonDb.collection('food_items').doc('rogue_burger');
    await assertFails(docRef.set({
      name: 'Free Burger',
      price: 0,
      imageUrl: 'http://hack.com/img.png',
      description: 'free',
      category: 'burger',
      isAvailable: true
    }));
  });

  it('rejects Dirty Payload 7: Customer self-marking payment status as paid', async () => {
    const userDb = testEnv.authenticatedContext('customer_uid').firestore();
    const docRef = userDb.collection('orders').doc('order_123');
    await assertFails(docRef.update({
      paymentStatus: 'paid'
    }));
  });
});
```
