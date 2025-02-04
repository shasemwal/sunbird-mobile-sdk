import { FilePaths } from "../../../services/file-path/file-path.enum";
import { FilePathService } from "../../../services/file-path/file-path.service";
export class Path {
    public static ASSETS_PATH = 'file:///android_asset/www/assets';

    public static dirPathFromFilePath(filePath: string): string {
        return filePath.substring(0, filePath.lastIndexOf('/'));
    }

    public static fileNameFromFilePath(filePath: string): string {
        return filePath.substring(filePath.lastIndexOf('/') + 1);
    }
    public static async getAssetPath(): Promise<string> {
        const platform = window.device.platform.toLowerCase();
        return platform === 'ios' ? "www/assets" : Path.ASSETS_PATH
    }
}
