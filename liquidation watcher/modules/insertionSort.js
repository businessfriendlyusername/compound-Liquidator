function insertionSort(arr, val) {
  if (!arr) throw { message: 'Array input is required' };
  for (let i = 1; i < arr.length; i++) {
    let j = i - 1;
    let temp = arr[i]
    let currentVal = val(arr[i]);
    for (; j >= 0 && val(arr[j]) > currentVal; j--) {
      arr[j + 1] = arr[j];
    }
    arr[j + 1] = temp;
  }
  return arr;
}