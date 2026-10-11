'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Auth = require('../js/auth.js');

test('credenziali corrette accettate', async () => {
  assert.equal(await Auth.verifyCredentials('nadirfx', 'SwagNadir33!'), true);
});

test('utente non case-sensitive, spazi ai bordi ignorati', async () => {
  assert.equal(await Auth.verifyCredentials('  NadirFX ', 'SwagNadir33!'), true);
});

test('password sbagliata rifiutata (anche di un solo carattere)', async () => {
  assert.equal(await Auth.verifyCredentials('nadirfx', 'SwagNadir33'), false);
  assert.equal(await Auth.verifyCredentials('nadirfx', 'swagNadir33!'), false);
  assert.equal(await Auth.verifyCredentials('nadirfx', ''), false);
});

test('utente sbagliato rifiutato anche con password giusta', async () => {
  assert.equal(await Auth.verifyCredentials('altro', 'SwagNadir33!'), false);
  assert.equal(await Auth.verifyCredentials('', 'SwagNadir33!'), false);
});

test('la password non compare in chiaro nel modulo', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/auth.js'), 'utf8');
  assert.equal(src.includes('SwagNadir33'), false);
});

test('confronto hex a tempo costante', () => {
  assert.equal(Auth.sameHex('abcd', 'abcd'), true);
  assert.equal(Auth.sameHex('abcd', 'abce'), false);
  assert.equal(Auth.sameHex('abcd', 'abc'), false);
});
