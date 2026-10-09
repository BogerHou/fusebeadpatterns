import { Project } from '../model/project/project.model';
import type { PrinterOptions } from './messages';

export interface Printer {
    name(): string;
    print(
        reducedColor: Uint8ClampedArray,
        usage: Map<string, number>,
        project: Project,
        filename: string,
        options?: PrinterOptions
    ): Promise<void>;
}
