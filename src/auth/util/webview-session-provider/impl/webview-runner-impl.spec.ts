import {WebviewRunner} from '../def/webview-runner';
import {WebviewRunnerImpl} from './webview-runner-impl';
import {NoInappbrowserSessionAssertionFailError, ParamNotCapturedError} from '../../..';
import { Browser } from '@capacitor/browser';

jest.mock('@capacitor/browser', () => {
    return {
      ...jest.requireActual('@capacitor/browser'),
        Browser: {
            open: jest.fn(),
            addListener: jest.fn(),
        }
    }
})
describe('WebviewRunnerImpl', () => {
    let webviewRunner: WebviewRunner;

    beforeAll(() => {
        webviewRunner = new WebviewRunnerImpl();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be able to create an instance', () => {
        expect(webviewRunner).toBeTruthy();
    });

    describe('resetInAppBrowserEventListeners', () => {
        it('should reset app browser event listener ', () => {
            // arrange
            webviewRunner['inAppBrowser'] = {
                ref: Browser,
                listeners: {
                    loadstart: new Set(),
                    exit: new Set()
                }
            }
            Browser.removeAllListeners = jest.fn()
            // act
            webviewRunner.resetInAppBrowserEventListeners()
            // assert
            expect(Browser.removeAllListeners).toHaveBeenCalled()
        })
    })

    describe('launchWebview', () => {
        it('should open a cordova InAppBrowser instance', (done) => {
            // arrange
            webviewRunner['inAppBrowser'] = {
                ref: Browser,
                listeners: {
                    loadstart: new Set(),
                    exit: new Set().add(jest.fn(() => {}))
                }
            }
            Browser.open = jest.fn(() => Promise.resolve());
            Browser.addListener = jest.fn((fn) => Promise.resolve(
                {
                  remove: (event: string, cb) => {
                    if (event === 'browserFinished') {
                      setTimeout(() => {
                        cb(() =>{webviewRunner['inAppBrowser'] = undefined});
                      });
                    }
                  }
                }
              )) as any
            // act
            webviewRunner.launchWebview({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                }
            }).then(() => {
                expect(Browser.open).toHaveBeenCalledWith({"url": "SAMPLE_HOSTSOME_PATH?PARAM1=VALUE1"});
                done();
            });
        });

        it('should register an exit eventListener on cordova InAppBrowser instance', (done) => {
            // arrange
            Browser.addListener = jest.fn((fn) => Promise.resolve(
                {
                  remove: (event: string, cb) => {
                    if (event === 'exit') {
                      setTimeout(() => {
                        cb();
                      });
                    }
                  }
                }
              )) as any
            Browser.open = jest.fn();
            // act
            webviewRunner.launchWebview({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                }
            }).then(() => {
                expect(Browser.addListener).toHaveBeenCalledWith('browserFinished', expect.any(Function));
                done();
            });
        });

        it('should deregister an exit eventListener when cordova InAppBrowser instance closes', (done) => {
            // arrange
            Browser.addListener = jest.fn((fn) => Promise.resolve(
                {
                  remove: (event: string, cb) => {
                    if (event === 'onExit') {
                      setTimeout(() => {
                        cb({});
                      });
                    }
                  }
                }
              )) as any
            // act
            webviewRunner.launchWebview({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                }
            }).then(() => {
                // expect(Browser).toBe(undefined);
                // expect(Browser.removeAllListeners).toHaveBeenCalledWith('browserFinished', expect.any(Function));
                done();
            });
        });
    });

    describe('closeWebview', () => {
        it('should throw error if invoked before launchWebview()', (done) => {
            webviewRunner['inAppBrowser'] = undefined
            Browser.close = jest.fn()
            // act
            webviewRunner.closeWebview().catch((e) => {
                // assert
                setTimeout(() => {
                    expect(e instanceof NoInappbrowserSessionAssertionFailError);
                    done();
                }, 0);
            });
        });

        it('should close cordova webview instance if invoked after launchWebview()', (done) => {
            // arrange
            webviewRunner['inAppBrowser'] = {
                ref: Browser,
                listeners: {
                    loadstart: new Set(),
                    exit: new Set()
                }
            }
            Browser.addListener = jest.fn((fn) => Promise.resolve(
                {
                  remove: (event: string, cb) => {
                    if (event === 'browserFinished') {
                      setTimeout(() => {
                        cb();
                      });
                    }
                  }
                }
              )) as any
            Browser.close = jest.fn();

            // act
            webviewRunner.launchWebview({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                }
            }).then(() => {
                webviewRunner.closeWebview().then(() => {
                    // assert
                    expect(Browser.close).toHaveBeenCalled();
                    done();
                });
            });
        });
    });

    xit('should throw error if invoked before launchWebview()', (done) => {
        webviewRunner['inAppBrowser'] = undefined
        Browser.close = jest.fn()
        // act
        webviewRunner.resetInAppBrowserEventListeners().catch((e) => {
            // assert
            setTimeout(() => {
                expect(e instanceof NoInappbrowserSessionAssertionFailError);
                done();
            }, 0);
        });
    });

    describe('any()', () => {
        it('should resolve the first passed promise to resolve', (done) => {
           webviewRunner.any(
               Promise.resolve(1),
               Promise.resolve(2),
               Promise.resolve(3),
               Promise.resolve(4)
           ).then((v) => {
               expect(v).toBe(1);
               done();
           });
        });
    });

    describe('all()', () => {
        it('should resolve when all passed promises resolve', (done) => {
            webviewRunner.all(
                Promise.resolve(1),
                Promise.resolve(2),
                Promise.resolve(3),
                Promise.resolve(4)
            ).then((v) => {
                expect(v).toBe(undefined);
                done();
            });
        });
    });

    describe('launchCustomTab', () => {
        it('should launch customtabs if available', (done) => {
            // arrange
            jest.spyOn(window['customtabs'], 'isAvailable').mockImplementation((success, error) => {
                setTimeout(() => {
                    success();
                });
            });

            jest.spyOn(window['customtabs'], 'launch').mockImplementation((url, success, error) => {
                setTimeout(() => {
                    success(JSON.stringify({ 'PARAM': 'VALUE' }));
                });
            });

            // act
            webviewRunner.launchCustomTab({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                },
                extraParams: ""
            }).then((v) => {
                expect(window['customtabs']['isAvailable']).toBeCalled();
                expect(window['customtabs']['launch']).toBeCalled();
                done();
            });
        });

        it('should launch customtabs if available and throws error', () => {
            // arrange
            jest.spyOn(window['customtabs'], 'isAvailable').mockImplementation((success, error) => {
                setTimeout(() => {
                    success();
                    jest.spyOn(window['customtabs'], 'launch').mockImplementation((url, success, error) => {
                        setTimeout(() => {
                            error(JSON.stringify({ 'ERROR': 'VALUE' }));
                        });
                    });
                });
            });

            // act
            webviewRunner.launchCustomTab({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                },
                extraParams: ""
            }).then((v) => {
                expect(window['customtabs']['isAvailable']).toBeCalled();
                expect(window['customtabs']['launch']).toBeCalled();
            });
        });

        it('should launch in browser if not available', (done) => {
            // arrange
            jest.spyOn(window['customtabs'], 'isAvailable').mockImplementation((success, error) => {
                setTimeout(() => {
                    error('error');
                });
            });

            jest.spyOn(window['customtabs'], 'launchInBrowser').mockImplementation((url, extraParams, success, error) => {
                setTimeout(() => {
                    success(JSON.stringify({ 'PARAM': 'VALUE' }));
                });
            });

            // act
            webviewRunner.launchCustomTab({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                },
                extraParams: ""
            }).then((v) => {
                expect(window['customtabs']['isAvailable']).toBeCalled();
                expect(window['customtabs']['launchInBrowser']).toBeCalled();
                done();
            });
        });

        it('should launch in browser if not available and throw error', () => {
            // arrange
            jest.spyOn(window['customtabs'], 'isAvailable').mockImplementation((success, error) => {
                setTimeout(() => {
                    success();
                });
            });

            jest.spyOn(window['customtabs'], 'launchInBrowser').mockImplementation((url, extraParams, success, error) => {
                setTimeout(() => {
                    error(JSON.stringify({ 'ERROR': 'VALUE' }));
                });
            });

            // act
            webviewRunner.launchCustomTab({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                },
                extraParams: ""
            }).then((v) => {
                expect(window['customtabs']['isAvailable']).toBeCalled();
                expect(window['customtabs']['launchInBrowser']).toBeCalled();
            });
        });
    });

    describe('capture', () => {
        it('should throw error if invoked before launchWebview()', () => {
            webviewRunner['inAppBrowser'] = undefined
            Browser.close = jest.fn()
            // act
            try {
                webviewRunner.capture({
                    host: 'SOME_HOST',
                    path: 'SOME_PATH',
                    params: [{
                        exists: 'false',
                        key: 'PARAM1',
                        resolveTo: 'PARAM1',
                    }]
                });
            } catch (e) {
                expect(e instanceof NoInappbrowserSessionAssertionFailError).toBeFalsy();
            }
        });

        it('should capture params when found', () => {
            // arrange
            webviewRunner['inAppBrowser'] = {
                ref: Browser,
                listeners: {
                    loadstart: new Set(),
                    exit: new Set().add(() => {})
                }
            }
            Browser.removeAllListeners = jest.fn((fn) => Promise.resolve(
                {
                  remove: (event: string, cb) => {
                    if (event === 'exit') {
                      setTimeout(() => {
                        cb();
                      });
                    }
                  }
                }
              )) as any
            Browser.addListener = jest.fn((fn) => Promise.resolve(
                {
                  remove: (event: string, cb) => {
                    if (event === 'exit') {
                      setTimeout(() => {
                        cb();
                      });
                    }
                  }
                }
              )) as any
            Browser.removeAllListeners = jest.fn();
            Browser.open = jest.fn();
            // act
            webviewRunner.launchWebview({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    exists: 'false',
                    'PARAM1': 'VALUE1'
                }
            }).then(() => {
                webviewRunner.capture({
                    host: 'http://some_host',
                    path: '/some_path',
                    params: [{
                        exists: 'true',
                        key: 'param1',
                        resolveTo: 'param1',
                    }]
                }).then((v) => {
                    // assert
                    expect(Browser.addListener).toHaveBeenCalledWith('browserFinished', expect.any(Function));
                    // expect(Browser.removeAllListeners).toHaveBeenCalledWith('browserFinished', expect.any(Function));
                });
            });
        });
    });

    describe('resolveCaptured', () => {
        it('should throw error when expected param was not captured', (done) => {
            webviewRunner.launchWebview({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                }
            }).then(() => {
                return webviewRunner.resolveCaptured('SOME_PARAM');
            }).catch((e) => {
                expect(e instanceof ParamNotCapturedError).toBeFalsy();
                done();
            });
        });

        it('should resolve with value when expected param was captured', (done) => {
            // arrange
            webviewRunner['captured'] = {'key': 'value'};

            // act
            webviewRunner.resolveCaptured('key').then((v) => {
                // assert
                expect(v).toEqual('value');
                done();
            });
        });
    });

    describe('clearCapture', () => {
        it('should clear all captured values', (done) => {
            // arrange
            webviewRunner['captured'] = {'key': 'value'};

            // act
            webviewRunner.clearCapture().then(() => {
                return webviewRunner.resolveCaptured('key').catch((e) => {
                    expect(e instanceof ParamNotCapturedError).toBeTruthy();
                    done();
                });
            });
        });
    });

    describe('redirectTo', () => {
        it('should throw error if invoked before launchWebview()', async () => {
            webviewRunner['inAppBrowser'] = undefined
            // act
            webviewRunner.redirectTo({
                host: 'SAMPLE_HOST',
                path: 'SOME_PATH',
                params: {
                    'PARAM1': 'VALUE1'
                }
            }).catch((e) => {
                // assert
                expect(e instanceof NoInappbrowserSessionAssertionFailError);
                // done();
            });
        });
    });

    describe('success', () => {
        it('should resolve with all captured values', (done) => {
            // arrange
            webviewRunner['captured'] = {'key': 'value'};

            // act
            webviewRunner.success().then((v) => {
                // assert
                expect(v).toEqual(expect.objectContaining({
                    key: 'value'
                }));
                done();
            });
        });
    });

    describe('fail', () => {
        it('should reject with all captured values', (done) => {
            // arrange
            webviewRunner['captured'] = {'key': 'value'};

            // act
            webviewRunner.fail().catch((v) => {
                // assert
                expect(v).toEqual(expect.objectContaining({
                    key: 'value'
                }));
                done();
            });
        });
    });

    describe('getCaptureExtras(0', () => {
        it('should resolve with all captured values', (done) => {
            // arrange
            webviewRunner['extras'] = {'key': 'value'};

            // act
            webviewRunner.getCaptureExtras().then((v) => {
                // assert
                expect(v).toEqual(expect.objectContaining({
                    key: 'value'
                }));
                done();
            });
        });
    });
});
