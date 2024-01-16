import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import "./css/NumberInput.css";

export default function NumberInput ({ value, onValueChange, defaultValue, minValue, maxValue}) {
  return (
    <TextField
      type="number"
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange(Math.min(Math.max(parseInt(e.target.value, 10), minValue), maxValue))}/>
  );
};