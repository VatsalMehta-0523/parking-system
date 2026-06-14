import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text } from 'react-konva';
import './DetectionPage.css';

export default function DetectionPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  
  // Slots state: array of { id: string, points: [x,y, x,y, ...], status: 'unknown'|'free'|'occupied' }
  const [slots, setSlots] = useState([]);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [resultsSummary, setResultsSummary] = useState(null);
  
  const stageRef = useRef(null);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        setImageObj(img);
        setSlots([]); // Reset slots on new image
        setResultsSummary(null);
      };
    }
  }, [imageFile]);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getPointerPosition();
  };

  const handleStageClick = (e) => {
    if (!imageObj) return;

    const pos = getPointerPos();
    if (!pos) return;

    if (!isDrawing) {
      // Start drawing
      setIsDrawing(true);
      setCurrentPoints([pos.x, pos.y]);
      setResultsSummary(null); // Clear previous results when drawing anew
    } else {
      // Continue drawing
      setCurrentPoints([...currentPoints, pos.x, pos.y]);
    }
  };

  const handleStageMouseMove = (e) => {
    // We could draw a dynamic line here if we wanted, but let's keep it simple
  };

  const finishPolygon = () => {
    if (currentPoints.length >= 6) { // At least a triangle (3 points * 2 coordinates)
      const newSlot = {
        id: `Slot-${slots.length + 1}`,
        points: currentPoints,
        status: 'unknown'
      };
      setSlots([...slots, newSlot]);
    } else {
      alert("A polygon needs at least 3 points.");
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const cancelPolygon = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const clearAll = () => {
    setSlots([]);
    setResultsSummary(null);
  };

  const runDetection = async () => {
    if (!imageFile || slots.length === 0) {
      alert("Please upload an image and draw at least one slot.");
      return;
    }

    setLoading(true);
    setResultsSummary(null);

    // Format slots for API: [[x1, y1], [x2, y2], ...]
    const formattedSlots = slots.map(slot => {
      const poly = [];
      for (let i = 0; i < slot.points.length; i += 2) {
        poly.push([slot.points[i], slot.points[i+1]]);
      }
      return { id: slot.id, polygon: poly };
    });

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("slots", JSON.stringify(formattedSlots));

    try {
      // Ensure API config is pointing correctly or use fetch directly.
      // I'll use standard fetch to ensure multipart works smoothly without axios interceptor issues.
      const token = localStorage.getItem('provider_token');
      const response = await fetch('/api/detect-slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // If your backend needs it, otherwise it'll be ignored if not required
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }
      
      // Update slots with status
      const updatedSlots = slots.map(slot => {
        const result = data.results.find(r => r.slot_id === slot.id);
        return {
          ...slot,
          status: result ? result.status : 'unknown'
        };
      });

      setSlots(updatedSlots);
      setResultsSummary(`Available Slots: ${data.available_slots} / ${slots.length}`);

    } catch (error) {
      console.error(error);
      alert("Error running detection. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Determine color based on status
  const getSlotColor = (status) => {
    if (status === 'free') return 'rgba(34, 197, 94, 0.6)'; // Green
    if (status === 'occupied') return 'rgba(239, 68, 68, 0.6)'; // Red
    return 'rgba(59, 130, 246, 0.5)'; // Blue default
  };

  const getSlotStroke = (status) => {
    if (status === 'free') return '#16a34a';
    if (status === 'occupied') return '#dc2626';
    return '#2563eb';
  };

  return (
    <div className="detection-page animate-fade-in">
      <header className="page-header">
        <h1 className="text-2xl font-bold">AI Parking Slot Detection</h1>
        <p className="text-secondary">Upload a camera feed image, map your slots, and run YOLOv8 detection.</p>
      </header>

      <div className="detection-container">
        {/* Left Sidebar for Controls */}
        <div className="detection-sidebar">
          <div className="control-group">
            <h3 className="group-title">1. Upload Image</h3>
            <label className="upload-btn">
              Choose Image
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
          </div>

          <div className="control-group">
            <h3 className="group-title">2. Draw Slots</h3>
            <p className="instruction-text">
              Click on the image to draw polygon corners. Click "Finish" to close the slot.
            </p>
            {isDrawing && (
              <div className="drawing-controls">
                <button className="btn btn-success" onClick={finishPolygon}>Finish Slot</button>
                <button className="btn btn-danger" onClick={cancelPolygon}>Cancel</button>
              </div>
            )}
            {!isDrawing && (
              <button className="btn btn-secondary w-full mb-2" onClick={() => setIsDrawing(true)} disabled={!imageObj}>
                Start New Slot
              </button>
            )}
            <button className="btn btn-outline-danger w-full" onClick={clearAll} disabled={slots.length === 0}>
              Clear All Slots
            </button>
          </div>

          <div className="control-group">
            <h3 className="group-title">3. Analysis</h3>
            <button 
              className="btn btn-primary w-full run-btn" 
              onClick={runDetection}
              disabled={loading || slots.length === 0 || !imageFile}
            >
              {loading ? 'Processing...' : 'Run YOLO Detection'}
            </button>
            
            {resultsSummary && (
              <div className="results-panel">
                <div className="results-summary text-lg font-bold">
                  {resultsSummary}
                </div>
                <div className="results-legend">
                  <div className="legend-item"><span className="dot dot-free"></span> Free</div>
                  <div className="legend-item"><span className="dot dot-occupied"></span> Occupied</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="slots-list">
            <h4 className="font-semibold mb-2">Defined Slots ({slots.length})</h4>
            {slots.map(s => (
              <div key={s.id} className="slot-list-item">
                <span className="font-medium">{s.id}</span>
                <span className={`status-badge status-${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="detection-workspace">
          {!imageObj ? (
            <div className="empty-state">
              <p>Upload an image to start mapping slots</p>
            </div>
          ) : (
            <div className="canvas-container">
              <Stage 
                width={imageObj.width > 800 ? 800 : imageObj.width} 
                height={imageObj.width > 800 ? (imageObj.height * (800 / imageObj.width)) : imageObj.height}
                onClick={handleStageClick}
                onMouseMove={handleStageMouseMove}
                ref={stageRef}
                className="konva-stage"
              >
                <Layer>
                  <KonvaImage 
                    image={imageObj} 
                    width={imageObj.width > 800 ? 800 : imageObj.width}
                    height={imageObj.width > 800 ? (imageObj.height * (800 / imageObj.width)) : imageObj.height}
                  />
                  
                  {/* Drawn slots */}
                  {slots.map((slot, i) => (
                    <React.Fragment key={slot.id}>
                      <Line
                        points={slot.points}
                        fill={getSlotColor(slot.status)}
                        stroke={getSlotStroke(slot.status)}
                        strokeWidth={2}
                        closed={true}
                        opacity={0.8}
                      />
                      <Text
                        text={slot.id}
                        x={slot.points[0]}
                        y={slot.points[1] - 15}
                        fill="white"
                        fontSize={16}
                        shadowColor="black"
                        shadowBlur={4}
                      />
                    </React.Fragment>
                  ))}

                  {/* Current drawing polygon */}
                  {isDrawing && currentPoints.length > 0 && (
                    <React.Fragment>
                      <Line
                        points={currentPoints}
                        stroke="#eab308"
                        strokeWidth={2}
                        closed={false}
                        dash={[5, 5]}
                      />
                      {currentPoints.map((pt, index) => {
                        if (index % 2 === 0) {
                          return (
                            <Circle
                              key={index}
                              x={currentPoints[index]}
                              y={currentPoints[index+1]}
                              radius={4}
                              fill="#eab308"
                            />
                          );
                        }
                        return null;
                      })}
                    </React.Fragment>
                  )}
                </Layer>
              </Stage>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
