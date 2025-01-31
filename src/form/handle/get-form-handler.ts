import {ApiRequestHandler, ApiService, HttpRequestType, Request} from '../../api';
import {FormRequest, FormServiceConfig} from '..';
import {from, Observable} from 'rxjs';
import {CachedItemRequestSourceFrom, CachedItemStore} from '../../key-value-store';
import {FileService} from '../../util/file/def/file-service';
import {Path} from '../../util/file/util/path';
import {map} from 'rxjs/operators';
import { throwError as rxjsThrowError } from 'rxjs';

export class GetFormHandler implements ApiRequestHandler<FormRequest, { [key: string]: {} }> {
    private readonly FORM_FILE_KEY_PREFIX = 'form-';
    private readonly FORM_LOCAL_KEY = 'form-';
    private readonly GET_FORM_DETAILS_ENDPOINT = '/read';

    constructor(
        private apiService: ApiService,
        private formServiceConfig: FormServiceConfig,
        private fileService: FileService,
        private cachedItemStore: CachedItemStore
    ) {
    }

    private static getIdForRequest(request: FormRequest): string {
        let id = `${request.type}_${request.subType}_${request.action}`;

        if (request.rootOrgId && request.rootOrgId !== '*') {
            id += ('_' + request.rootOrgId);
        }

        if (request.framework) {
            id += ('_' + request.framework);
        }

        if (request.component) {
            id += ('_' + request.component);
        }

        return id;
    }

    handle(request: FormRequest): Observable<{ [key: string]: {} }> {
        return this.cachedItemStore[request.from === CachedItemRequestSourceFrom.SERVER ? 'get' : 'getCached'](
            GetFormHandler.getIdForRequest(request),
            this.FORM_LOCAL_KEY,
            'ttl_' + this.FORM_LOCAL_KEY,
            () => this.fetchFormServer(request),
            () => this.fetchFromFile(request)
        );
    }

    private fetchFormServer(request: FormRequest): Observable<{ [key: string]: {} }> {
        const apiRequest: Request = new Request.Builder()
            .withType(HttpRequestType.POST)
            .withPath(this.formServiceConfig.apiPath + this.GET_FORM_DETAILS_ENDPOINT)
            .withBearerToken(true)
            .withHeaders({
                'X-Platform-Id': window.device.platform
            })
            .withBody({request})
            .build();
        return this.apiService.fetch <{ result: { [key: string]: {} } }>(apiRequest)
            .pipe(
                map((success) => {
                    return success.body.result;
                })
            );
    }

    private fetchFromFile(request: FormRequest): Observable<{ [key: string]: {} }> {
        const dir = Path.getAssetPath() + this.formServiceConfig.formConfigDirPath;
        const file = this.FORM_FILE_KEY_PREFIX + GetFormHandler.getIdForRequest(request) + '.json';
        
        try {
            const filePath = dir.concat('/', file);
            return from(this.fileService.readFileFromAssets(filePath).then(fileContent => {
                const result = JSON.parse(fileContent);
                return result.result;
            }));
        } catch (error) {
            console.error('Error reading form file:', error);
            return throwError(error);
        }
    }
}

function throwError(error: unknown): Observable<{ [key: string]: {}; }> {
    return rxjsThrowError(error);
}
