import { useMapEvents } from "react-leaflet";

interface Props {
  onClick: (lat: number, lng: number) => void;
}

const MapClickHandler = ({ onClick }: Props) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export default MapClickHandler;
