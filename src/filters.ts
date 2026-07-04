// src/filters.ts
export interface FilterAction {
  id: string;
  filterType: string;
  label: string;
  icon: string;
  message: string;
}

export const FILTER_ACTIONS: FilterAction[] = [
  {
    id: "btn-blanconegro",
    filterType: "grayscale",
    label: "Blanco y negro",
    icon: "fa-solid fa-circle-half-stroke",
    message: "Filtro: Blanco y Negro",
  },
  {
    id: "btn-sepia",
    filterType: "sepia",
    label: "Sepia",
    icon: "fa-solid fa-camera-retro",
    message: "Filtro: Sepia",
  },
  {
    id: "btn-invert",
    filterType: "invert",
    label: "Invertir",
    icon: "fa-solid fa-yin-yang",
    message: "Filtro: Negativo",
  },
  {
    id: "btn-normal",
    filterType: "none",
    label: "Video Original",
    icon: "fa-solid fa-video",
    message: "Filtro: Ninguno (Normal)",
  },
  {
    id: "btn-edge",
    filterType: "edge",
    label: "Bordes",
    icon: "fa-solid fa-border-all",
    message: "Filtro: Detección de Bordes",
  },
  {
    id: "btn-contrast",
    filterType: "contrast",
    label: "Alto Contraste",
    icon: "fa-solid fa-sun",
    message: "Filtro: Alto Contraste",
  },
  {
    id: "btn-emboss",
    filterType: "emboss",
    label: "Relieve",
    icon: "fa-solid fa-mountain",
    message: "Filtro: Relieve (Emboss)",
  },
  {
    id: "btn-threshold",
    filterType: "threshold",
    label: "Binarizado",
    icon: "fa-solid fa-barcode",
    message: "Filtro: Binarizado (Blanco/Negro puro)",
  },
  {
    id: "btn-posterize",
    filterType: "posterize",
    label: "Posterizar",
    icon: "fa-solid fa-layer-group",
    message: "Filtro: Posterizado (8-bits)",
  },
  {
    id: "btn-red-channel",
    filterType: "red-channel",
    label: "Canal Rojo",
    icon: "fa-solid fa-eye-dropper",
    message: "Filtro: Solo Canal Rojo",
  },
];
