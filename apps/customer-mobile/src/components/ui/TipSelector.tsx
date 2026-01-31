/**
 * Tip Selector Component
 * Enhanced tip selection with percentage and fixed amount options
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

interface TipSelectorProps {
  subtotal: number;
  selectedTip: number;
  onTipChange: (tip: number) => void;
  tipType?: 'percentage' | 'fixed';
}

export default function TipSelector({
  subtotal,
  selectedTip,
  onTipChange,
  tipType = 'percentage',
}: TipSelectorProps) {
  const [customTip, setCustomTip] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const percentageOptions = [15, 18, 20, 25];
  const fixedOptions = [0, 200, 300, 500]; // $0, $2, $3, $5

  const options = tipType === 'percentage' ? percentageOptions : fixedOptions;

  const handleTipSelect = (tip: number) => {
    setShowCustomInput(false);
    setCustomTip('');
    onTipChange(tip);
  };

  const handleCustomTip = () => {
    const tipValue = parseFloat(customTip);
    if (!isNaN(tipValue) && tipValue >= 0) {
      const tipInCents =
        tipType === 'percentage'
          ? Math.round((tipValue / 100) * subtotal)
          : Math.round(tipValue * 100);
      onTipChange(tipInCents);
    }
  };

  const getTipDisplay = (tip: number) => {
    if (tipType === 'percentage') {
      return `${tip}%`;
    } else {
      return tip === 0 ? 'No Tip' : `$${(tip / 100).toFixed(2)}`;
    }
  };

  const getTipValue = (tip: number) => {
    if (tipType === 'percentage') {
      return Math.round((tip / 100) * subtotal);
    } else {
      return tip;
    }
  };

  const getTipPercentage = () => {
    if (selectedTip === 0) return 0;
    return Math.round((selectedTip / subtotal) * 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a tip for your driver</Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const tipValue = getTipValue(option);
          const isSelected = selectedTip === tipValue;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.option, isSelected && styles.optionActive]}
              onPress={() => handleTipSelect(tipValue)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                {getTipDisplay(option)}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.option, showCustomInput && styles.optionActive]}
          onPress={() => setShowCustomInput(!showCustomInput)}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, showCustomInput && styles.optionTextActive]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustomInput && (
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            value={customTip}
            onChangeText={setCustomTip}
            placeholder={tipType === 'percentage' ? '15' : '5.00'}
            keyboardType="decimal-pad"
            onBlur={handleCustomTip}
            onSubmitEditing={handleCustomTip}
          />
          <Text style={styles.customInputSuffix}>{tipType === 'percentage' ? '%' : '$'}</Text>
        </View>
      )}

      {selectedTip > 0 && (
        <View style={styles.tipInfo}>
          <Text style={styles.tipInfoText}>
            Tip:{' '}
            {tipType === 'percentage'
              ? `${getTipPercentage()}%`
              : `$${(selectedTip / 100).toFixed(2)}`}
          </Text>
          {tipType === 'percentage' && (
            <Text style={styles.tipInfoSubtext}>(${(selectedTip / 100).toFixed(2)})</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: '#ff9800',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f5f5f',
  },
  optionTextActive: {
    color: '#fff',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  customInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#151515',
  },
  customInputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5f5f5f',
  },
  tipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  tipInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
  },
  tipInfoSubtext: {
    fontSize: 14,
    color: '#5f5f5f',
  },
});
