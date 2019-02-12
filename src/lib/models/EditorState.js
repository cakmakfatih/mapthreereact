import FileService from "../services/FileService";

export type EditorState = {
    menu: string,
    objects: Array<mixed>,
    activeLevel: number,
    levels: Array<mixed>,
    fileService: FileService
};