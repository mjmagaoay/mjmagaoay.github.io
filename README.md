# Product Pricing Calculator

A progressive web app (PWA) for calculating product bundle prices with markup. Create product bundles with multiple line items, apply percentage-based markup, and save them locally using IndexedDB.

## Features

- Create and edit product bundles with multiple line items
- Automatic price calculation with configurable markup percentage
- Persistent storage using IndexedDB
- Offline support via service worker
- Installable as a PWA

## Usage

1. Click **+ New Product** to create a product bundle
2. Add line items with name, price per quantity, and quantity
3. Set your target markup percentage
4. Save the product to store it locally

## Disclaimer

This application uses **Firebase Firestore** as its database. Firestore security rules are applied, which require users to authenticate via **Google Login** before they can read or write data.

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
