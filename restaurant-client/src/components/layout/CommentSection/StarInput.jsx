import { Star } from "lucide-react";
import { useState } from "react";

const StarInput = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);
     return (
        <div className="d-flex align-items-center mb-4">
            <div className="d-flex">
                {[...Array(5)].map((_, i) => {
                    const index = i + 1;
                    return (
                        <Star
                            key={i}
                            onClick={() => setRating(index)}
                            onMouseEnter={() => setHover(index)}
                            onMouseLeave={() => setHover(0)}
                            size={28}
                            style={{
                                cursor: 'pointer',
                                marginRight: '4px',
                                color: index <= (hover || rating) ? '#FFD700' : '#d3d3d3',
                                fill: index <= (hover || rating) ? '#FFD700' : 'transparent',
                                transform: index <= (hover || rating) ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s ease',
                                filter: index <= (hover || rating) ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' : 'none'
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};


export default StarInput;