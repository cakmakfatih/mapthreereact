import FileService from "../services/FileService";

export type EditorState = {
    menu: string,
    objects: Array<mixed>,
    activeLayer: number,
    layers: Array<mixed>
};