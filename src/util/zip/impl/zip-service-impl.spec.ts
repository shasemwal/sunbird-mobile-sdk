import {Container} from 'inversify';
import {ZipService} from '../def/zip-service';
import {InjectionTokens} from '../../../injection-tokens';
import {ZipServiceImpl} from './zip-service-impl';

describe('ZipServiceImpl', () => {
    let zipService: ZipService;
    const container = new Container();

    beforeAll(() => {
        container.bind<ZipService>(InjectionTokens.ZIP_SERVICE).to(ZipServiceImpl);

        zipService = container.get(InjectionTokens.ZIP_SERVICE);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('unzip()', () => {
        describe('when successful', () => {
            it('should delegate to cordova JJzip.unzip', () => {
                // arrange
                jest.spyOn(window['JJzip'], 'unzip').mockReturnValue((a, b, c, d) => {
                    setTimeout(() => c(), 0);
                });

                // act
                zipService.unzip('SOME_ZIP', {}, () => {
                });
            });

            it('should delegate to cordova JJzip.unzip with optional callback', (done) => {
                // arrange
                jest.spyOn(window['JJzip'], 'unzip').mockReturnValue((a, b, c, d) => {
                    c();
                });

                // act
                zipService.unzip('SOME_ZIP', {});

                done();
            });
        });

        describe('when failure', () => {
            it('should delegate to cordova JJzip.unzip', () => {
                // arrange
                jest.spyOn(window['JJzip'], 'unzip').mockReturnValue((a, b, c, d) => {
                    setTimeout(() => d(), 0);
                });

                // act
                zipService.unzip('SOME_ZIP', {}, null, () => {
                });
            });

            it('should delegate to cordova JJzip.unzip with optional callback', (done) => {
                // arrange
                jest.spyOn(window['JJzip'], 'unzip').mockReturnValue((a, b, c, d) => {
                    d();
                });

                // act
                zipService.unzip('SOME_ZIP', {});

                done();
            });
        });
    });

    describe('zip()', () => {
        describe('when successful', () => {
            it('should delegate to cordova JJzip.zip', () => {
                // arrange
                jest.spyOn(window['JJzip'], 'zip').mockReturnValue((a, b, c, d, e, f) => {
                    setTimeout(() => e(), 0);
                });

                // act
                zipService.zip('SOME_ZIP', {}, [], [], () => {
                });
            });

            it('should delegate to cordova JJzip.zip with optional callback', (done) => {
                // arrange
                jest.spyOn(window['JJzip'], 'zip').mockReturnValue((a, b, c, d, e, f) => {
                    e();
                });

                // act
                zipService.zip('SOME_ZIP', {}, [], []);

                done();
            });
        });

        describe('when failure', () => {
            it('should delegate to cordova JJzip.zip', () => {
                // arrange
                jest.spyOn(window['JJzip'], 'zip').mockReturnValue((a, b, c, d, e, f) => {
                    setTimeout(() => f(), 0);
                });

                // act
                zipService.zip('SOME_ZIP', {}, [], [], null, () => {
                });
            });

            it('should delegate to cordova JJzip.zip with optional callback', (done) => {
                // arrange
                jest.spyOn(window['JJzip'], 'zip').mockReturnValue((a, b, c, d, e, f) => {
                    f();
                });

                // act
                zipService.zip('SOME_ZIP', {}, [], []);

                done();
            });
        });
    });
});
