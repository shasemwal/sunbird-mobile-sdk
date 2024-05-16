import {Container} from 'inversify';
import {InjectionTokens} from '../../../injection-tokens';
import {SharedPreferences} from '..';
import {SharedPreferencesAndroid} from './shared-preferences-android';
import { Preferences } from '@capacitor/preferences';

jest.mock('@capacitor/preferences', () => {
    return {
      ...jest.requireActual('@capacitor/preferences'),
        Preferences: {
            configure: jest.fn(),
            get: jest.fn()
        }
    }
})

describe('SharedPreferencesAndroid', () => {
    let sharedPreferences: SharedPreferences;
    const container = new Container();
    Preferences.configure = jest.fn();
    beforeAll(() => {
        container.bind<SharedPreferences>(InjectionTokens.SHARED_PREFERENCES).to(SharedPreferencesAndroid);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('getString()', () => {
        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: ''}));
        });

        it('should normalise and resolve from localStorage first', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: ''}));
            sharedPreferences = container.get(InjectionTokens.SHARED_PREFERENCES);
            localStorage.setItem('SOME_KEY', 'SOME__LOCALSTORAGE_VALUE');

            sharedPreferences.getString('SOME_KEY').subscribe((v) => {
                expect(v).toBe('SOME__LOCALSTORAGE_VALUE');
            });
        });

        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: ''}));
            sharedPreferences.getString('SOME_KEY').subscribe(null, (e) => {
                expect(e).toBe('SOME_ERROR');
            });
        });
    });

    describe('putString()', () => {
        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: ''}));
            sharedPreferences.putString('SOME_KEY', 'SOME_VALUE').subscribe((v) => {
            });
        });

        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: ''}));
            Preferences.set = jest.fn();
            sharedPreferences.putString('SOME_KEY', 'SOME_VALUE').subscribe(null, (e) => {
                expect(e).toBe('SOME_ERROR');
            });
        });
    });

    describe('getBoolean()', () => {
        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: 'true'}));
            Preferences.set = jest.fn();
            sharedPreferences.getBoolean('SOME_KEY').subscribe((v) => {
                expect(v).toBe(true);
            });
        });

        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: 'SOME_ERROR'}));
            Preferences.set = jest.fn();
            sharedPreferences.getBoolean('SOME_KEY').subscribe(null, (e) => {
                expect(e).toBe('SOME_ERROR');
            });
        });

        it('should normalise and resolve from localStorage first for falsy values', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: 'false'}));
            Preferences.set = jest.fn();

            sharedPreferences = container.get(InjectionTokens.SHARED_PREFERENCES);
            localStorage.setItem('SOME_KEY', 'falsy_value');

            sharedPreferences.getBoolean('SOME_KEY').subscribe((v) => {
                expect(v).toBe(false);
            });
        });

        it('should normalise and resolve from localStorage first for \'true\' values', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: ''}));
            Preferences.set = jest.fn();localStorage.setItem('SOME_KEY', 'true');

            sharedPreferences.getBoolean('SOME_KEY').subscribe((v) => {
                expect(v).toBe(true);
            });
        });
    });

    describe('putBoolean()', () => {
        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: 'true'}));
            Preferences.set = jest.fn();
            sharedPreferences.putBoolean('SOME_KEY', true).subscribe((v) => {
            });
        });

        it('should delegate to cordova sharedPreferences', () => {
            Preferences.configure = jest.fn();
            Preferences.get = jest.fn(() => Promise.resolve({value: 'SOME_ERROR'}));
            Preferences.set = jest.fn();
            sharedPreferences.putBoolean('SOME_KEY', true).subscribe(null, (e) => {
                expect(e).toBe('SOME_ERROR');
            });
        });
    });
});
